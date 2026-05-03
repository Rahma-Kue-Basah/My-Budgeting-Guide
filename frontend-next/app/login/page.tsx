import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next;

  redirect(next ? `/?auth=login&next=${encodeURIComponent(next)}` : "/?auth=login");
}
