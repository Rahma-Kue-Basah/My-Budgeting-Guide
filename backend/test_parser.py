"""
BCA Bank Statement PDF Parser — supports KlikBCA / BCA Mobile monthly statements.
Usage:
    python test_parser.py statement.pdf
    python test_parser.py statement.pdf -o result.json -p
    python test_parser.py statement.pdf --debug   # dump filtered lines + blocks to stderr
"""

import re
import sys
import json
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional, List, Dict, Tuple

import pdfplumber


# ── Amount patterns ───────────────────────────────────────────────────────────

# BCA prints amounts with comma-thousands and dot-decimal: 1,234,567.89
# Echo/reference amounts have NO comma grouping: 150000.00  41000.00
# This pattern requires comma grouping for numbers ≥ 1000, so echo lines are
# rejected as mutation candidates.
_MUT_AMT = r'(?:\d{1,3}(?:,\d{3})+|\d{1,3})\.\d{2}'

# A pure "mutation line": only amounts + optional DB marker, nothing else.
# Examples: "44,000.00 DB 547,532.75"  "200,000.00 251,795.75"  "500,000.00"
MUTATION_LINE_RE = re.compile(
    rf'^\s*({_MUT_AMT})\s*(DB\b)?\s*({_MUT_AMT})?\s*$'
)

# Fallback: mutation embedded at end of a descriptive line,
# e.g. "BIAYA ADM 10,000.00 DB 813,564.75"
_EMBEDDED_MUT_RE = re.compile(
    rf'({_MUT_AMT})\s*(DB\b)?\s*({_MUT_AMT})?\s*$'
)

# Transaction block header: line starts with DD/MM
BLOCK_START_RE = re.compile(r'^(\d{2})/(\d{2})\s*(.*)')

# QR reference code concatenated with merchant: "00000.00Lokomart"
REF_CODE_RE = re.compile(r'^\d+\.\d{2}[A-Za-z]')

# Lines that are just dashes or a bare integer reference number
JUNK_LINE_RE = re.compile(r'^[\-\s\.]+$|^\d{3,}$')

# Remaining boilerplate after page-header stripping
BOILERPLATE_RE = re.compile(
    r'(Bersambung ke halaman|REKENING TAHAPAN|'
    r'Apabila nasabah|nasabah dianggap|telah menyetujui|BCA berhak|'
    r'Laporan Mutasi|TANGGAL\s+KETERANGAN|MUTASI\s+[CD][RB])',
    re.IGNORECASE,
)

# Summary lines at end of statement — filter from block lines but keep for header
SUMMARY_RE = re.compile(r'^SALDO\s+(AWAL|AKHIR)\s*:', re.IGNORECASE)

# Header patterns (applied to raw, unfiltered text)
ACCOUNT_RE = re.compile(
    r'N\s*O\s*\.?\s*R\s*E\s*K\s*E\s*N\s*I\s*N\s*G\s*[:\-]?\s*([\d][\d ]{4,24})',
    re.IGNORECASE,
)
PERIOD_RE = re.compile(
    r'P\s*E\s*R\s*I\s*O\s*D\s*E\s*[:\-]?\s*'
    r'([A-Za-z](?:\s*[A-Za-z])+)\s+'
    r'(2\s*0\s*\d[\s\d]*\d)',
    re.IGNORECASE,
)
OPENING_BAL_RE = re.compile(r'SALDO\s+AWAL\s*[:\-]?\s*([\d,]+\.\d{2})', re.IGNORECASE)
CLOSING_BAL_RE = re.compile(r'SALDO\s+AKHIR\s*[:\-]?\s*([\d,]+\.\d{2})', re.IGNORECASE)

MONTH_NAME_MAP: Dict[str, int] = {
    'januari': 1, 'februari': 2, 'maret': 3, 'april': 4,
    'mei': 5, 'juni': 6, 'juli': 7, 'agustus': 8,
    'september': 9, 'oktober': 10, 'november': 11, 'desember': 12,
    'january': 1, 'february': 2, 'march': 3, 'may': 5, 'june': 6,
    'july': 7, 'august': 8, 'october': 10, 'december': 12,
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def parse_amount(text: str) -> float:
    """'1,234,567.89' → 1234567.89"""
    return float(text.replace(',', ''))


# ── Parser ────────────────────────────────────────────────────────────────────

class BCAStatementParser:

    def __init__(self, pdf_path: str):
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

    def parse(self, debug: bool = False) -> dict:
        with pdfplumber.open(self.pdf_path) as pdf:
            raw_text, filtered_lines = self._extract_text_and_lines(pdf)

        if debug:
            print("=== FILTERED LINES ===", file=sys.stderr)
            for i, ln in enumerate(filtered_lines):
                print(f"{i:4d}: {repr(ln)}", file=sys.stderr)
            print("=== END FILTERED ===\n", file=sys.stderr)

        header = self._extract_header(raw_text)
        year: int = header.pop('_year', datetime.now().year)
        transactions = self._extract_transactions(filtered_lines, year, debug)

        return {
            **header,
            'transactions': transactions,
            'transaction_count': len(transactions),
            'parsed_at': datetime.now().isoformat(),
        }

    # ── Text extraction ───────────────────────────────────────────────────────

    def _extract_text_and_lines(self, pdf: pdfplumber.PDF) -> Tuple[str, List[str]]:
        """Return (raw_text, filtered_lines).

        Page headers are removed by detecting the account-number line and
        skipping forward until the notes footer ends with 'Rekening ini.'
        """
        raw_lines: List[str] = []
        for page in pdf.pages:
            text = page.extract_text() or ''
            raw_lines.extend(ln.strip() for ln in text.splitlines())

        filtered: List[str] = []
        skip = False

        for line in raw_lines:
            if not line:
                continue

            if skip:
                # End of page-header block
                if re.search(r'[Rr]ekening\s+ini\.?', line):
                    skip = False
                continue

            # Trigger: account-number line marks start of page header.
            # Also remove the preceding branch-name line (e.g. "KCP SUKOHARJO").
            if re.search(r'NO\.?\s*REKENING\s*:', line, re.IGNORECASE):
                if filtered and not BLOCK_START_RE.match(filtered[-1]):
                    filtered.pop()
                skip = True
                continue

            # Standalone summary lines at end of statement
            if SUMMARY_RE.match(line):
                continue

            # Remaining generic boilerplate
            if BOILERPLATE_RE.search(line):
                continue

            filtered.append(line)

        return '\n'.join(raw_lines), filtered

    # ── Header ────────────────────────────────────────────────────────────────

    def _extract_header(self, raw_text: str) -> dict:
        header: dict = {}

        m = ACCOUNT_RE.search(raw_text)
        if m:
            header['account_number'] = re.sub(r'\s+', '', m.group(1))

        m = PERIOD_RE.search(raw_text)
        if m:
            year_raw = re.sub(r'\s+', '', m.group(2))
            period_month = re.sub(r'\s+', '', m.group(1)).strip()
            header['period'] = f"{period_month} {year_raw}"
            header['_year'] = int(year_raw)

        m = OPENING_BAL_RE.search(raw_text)
        if m:
            header['opening_balance'] = parse_amount(m.group(1))

        m = CLOSING_BAL_RE.search(raw_text)
        if m:
            header['closing_balance'] = parse_amount(m.group(1))

        return header

    # ── Transaction extraction ────────────────────────────────────────────────

    def _extract_transactions(
        self, lines: List[str], year: int, debug: bool
    ) -> List[Dict]:
        blocks: List[List[str]] = []
        current: Optional[List[str]] = None

        for line in lines:
            if BLOCK_START_RE.match(line):
                if current is not None:
                    blocks.append(current)
                current = [line]
            elif current is not None:
                current.append(line)
        if current:
            blocks.append(current)

        if debug:
            print(f"=== {len(blocks)} BLOCKS ===", file=sys.stderr)
            for i, blk in enumerate(blocks):
                print(f"BLOCK {i:3d}: {blk}", file=sys.stderr)

        results: List[Dict] = []
        for block in blocks:
            txn = self._parse_block(block, year)
            if txn:
                results.append(txn)
        return results

    def _parse_block(self, block: List[str], year: int) -> Optional[Dict]:
        if not block:
            return None

        m = BLOCK_START_RE.match(block[0])
        if not m:
            return None

        day = int(m.group(1))
        month = int(m.group(2))
        date_str = f"{year}-{month:02d}-{day:02d}"

        if re.search(r'SALDO\s+AWAL', block[0], re.IGNORECASE):
            return None

        # ── Locate mutation line ───────────────────────────────────────────
        # Strategy 1: scan from bottom for a pure-amount line (properly formatted)
        mutation_amount: Optional[float] = None
        is_debit = False
        balance: Optional[float] = None
        mutation_line_text: Optional[str] = None

        for line in reversed(block):
            mm = MUTATION_LINE_RE.match(line.strip())
            if mm:
                mutation_amount = parse_amount(mm.group(1))
                is_debit = bool(mm.group(2))
                balance = parse_amount(mm.group(3)) if mm.group(3) else None
                mutation_line_text = line.strip()
                break

        # Strategy 2: mutation is embedded at end of a descriptive line
        # e.g. "TRANSAKSI DEBIT TGL: 01/02 44,000.00 DB 547,532.75"
        #      "BIAYA ADM 10,000.00 DB 813,564.75"
        if mutation_amount is None:
            for line in block:
                line_s = line.strip()
                if REF_CODE_RE.match(line_s):
                    continue
                mm = _EMBEDDED_MUT_RE.search(line_s)
                if mm:
                    mutation_amount = parse_amount(mm.group(1))
                    is_debit = bool(mm.group(2))
                    balance = parse_amount(mm.group(3)) if mm.group(3) else None
                    mutation_line_text = mm.group(0).strip()
                    break

        if not mutation_amount:
            return None

        # ── Build description ─────────────────────────────────────────────
        desc_parts: List[str] = []
        for line in block:
            line_s = line.strip()
            if not line_s:
                continue

            # Strip DD/MM prefix on first line
            lm = BLOCK_START_RE.match(line_s)
            text_part = lm.group(3).strip() if lm else line_s

            if not text_part:
                continue
            if JUNK_LINE_RE.match(text_part):
                continue

            # Strip the mutation fragment from end of line
            if mutation_line_text:
                text_part = re.sub(
                    re.escape(mutation_line_text) + r'\s*$', '', text_part
                ).strip()
                if not text_part:
                    continue

            # Extract merchant from QR reference codes like "00000.00Lokomart"
            if REF_CODE_RE.match(text_part):
                merchant = re.sub(r'^\d+\.\d{2}', '', text_part).strip()
                if merchant:
                    desc_parts.append(merchant)
                continue

            desc_parts.append(text_part)

        description = re.sub(r'\s+', ' ', ' '.join(desc_parts)).strip()

        txn: Dict = {'date': date_str, 'description': description}
        if is_debit:
            txn['debit'] = mutation_amount
            txn['type'] = 'debit'
        else:
            txn['credit'] = mutation_amount
            txn['type'] = 'credit'
        if balance is not None:
            txn['balance'] = balance

        return txn


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser(description='Parse BCA bank statement PDF to JSON')
    ap.add_argument('pdf', help='Path to BCA statement PDF')
    ap.add_argument('--output', '-o', help='Output JSON file (default: stdout)')
    ap.add_argument('--pretty', '-p', action='store_true', help='Pretty-print JSON')
    ap.add_argument('--debug', '-d', action='store_true',
                    help='Dump filtered lines and blocks to stderr')
    args = ap.parse_args()

    try:
        result = BCAStatementParser(args.pdf).parse(debug=args.debug)
    except FileNotFoundError as e:
        print(f'Error: {e}', file=sys.stderr)
        sys.exit(1)

    indent = 2 if args.pretty else None
    json_output = json.dumps(result, indent=indent, ensure_ascii=False)

    if args.output:
        Path(args.output).write_text(json_output, encoding='utf-8')
        print(f"Saved to {args.output}  ({result['transaction_count']} transactions)")
    else:
        print(json_output)


if __name__ == '__main__':
    main()
