import { notFound } from "next/navigation";
import { MARKETPLACES, getMarketplace } from "@/lib/marketplaces";
import { MarketView } from "./MarketView";

export function generateStaticParams() {
  return MARKETPLACES.map((m) => ({ id: m.id }));
}

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = getMarketplace(id);
  if (!m) notFound();
  return <MarketView id={m.id} />;
}
