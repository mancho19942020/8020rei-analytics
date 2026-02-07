'use client';

interface Client {
  client: string;
  events: number;
  users: number;
  page_views: number;
}

interface ClientsTableProps {
  data: Client[];
}

export function ClientsTable({ data }: ClientsTableProps) {
  return (
    <div className="bg-surface-raised rounded-lg border border-stroke p-4 shadow-sm">
      <h3 className="text-h4 text-content-primary font-semibold mb-4">Top Clients</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-label text-content-secondary border-b border-stroke">
              <th className="pb-3 font-medium">Client</th>
              <th className="pb-3 font-medium">Events</th>
              <th className="pb-3 font-medium">Users</th>
              <th className="pb-3 font-medium">Page Views</th>
            </tr>
          </thead>
          <tbody className="text-body-regular">
            {data.map((client, index) => (
              <tr
                key={client.client}
                className={`${index !== data.length - 1 ? 'border-b border-stroke-subtle' : ''} hover:bg-surface-overlay transition-colors duration-150`}
              >
                <td className="py-3 font-medium text-content-primary">{client.client}</td>
                <td className="py-3 text-content-secondary">{client.events?.toLocaleString()}</td>
                <td className="py-3 text-content-secondary">{client.users}</td>
                <td className="py-3 text-content-secondary">{client.page_views?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
