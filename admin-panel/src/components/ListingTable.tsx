import { format } from "date-fns";
import {
  EyeIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  imageUrl: string | null;
  images: string[];
  description: string;
  userId: string;
  sellerName?: string;
  isNegotiable?: boolean;
  meetupLocation?: string;
  createdAt: any;
}

interface ListingTableProps {
  listings: ListingRow[];
  loading: boolean;
  onView: (listing: ListingRow) => void;
  onDelete: (listing: ListingRow) => void;
  onMarkSold: (listing: ListingRow) => void;
}

export default function ListingTable({
  listings,
  loading,
  onView,
  onDelete,
  onMarkSold,
}: ListingTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-border/20 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-secondary text-lg">No listings found</p>
        <p className="text-secondary/60 text-sm mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }

  const formatDate = (ts: any) => {
    if (!ts) return "N/A";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, "MMM d, yyyy");
    } catch {
      return "N/A";
    }
  };

  const statusColors: Record<string, string> = {
    active: "bg-success/15 text-success",
    sold: "bg-primary/15 text-primary",
    deleted: "bg-danger/15 text-danger",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Listing
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">
              Category
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Price
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">
              Condition
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden md:table-cell">
              Seller
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider hidden lg:table-cell">
              Posted
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Status
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-secondary uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {listings.map((listing) => (
            <tr
              key={listing.id}
              className="border-b border-border/30 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                  {listing.imageUrl ? (
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="w-10 h-10 rounded-lg object-cover ring-1 ring-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-border/30 flex items-center justify-center text-secondary text-xs">
                      N/A
                    </div>
                  )}
                  <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                    {listing.title}
                  </p>
                </div>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="text-sm text-secondary">{listing.category}</span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm font-semibold text-white">
                  Rs {listing.price?.toLocaleString()}
                </span>
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <span className="text-sm text-secondary">{listing.condition}</span>
              </td>
              <td className="py-3 px-4 hidden md:table-cell">
                <span className="text-sm text-secondary">{listing.sellerName || "Unknown"}</span>
              </td>
              <td className="py-3 px-4 hidden lg:table-cell">
                <span className="text-sm text-secondary">{formatDate(listing.createdAt)}</span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    statusColors[listing.status] || statusColors.active
                  }`}
                >
                  {listing.status?.charAt(0).toUpperCase() + listing.status?.slice(1)}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onView(listing)}
                    className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                    title="View"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  {listing.status === "active" && (
                    <button
                      onClick={() => onMarkSold(listing)}
                      className="p-1.5 rounded-lg text-secondary hover:text-success hover:bg-success/10 transition-colors"
                      title="Mark Sold"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(listing)}
                    className="p-1.5 rounded-lg text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
