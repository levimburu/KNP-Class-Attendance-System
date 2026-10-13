import { PageHeader, Card, EmptyState } from "../components/ui";

export default function Placeholder({ title, note }: { title: string; note?: string }) {
  return (
    <>
      <PageHeader title={title} subtitle="Planned module" />
      <Card className="p-6">
        <EmptyState
          title="Coming in a later phase"
          hint={note || "The data model and security for this area are already in place; the screen is next."}
        />
      </Card>
    </>
  );
}
