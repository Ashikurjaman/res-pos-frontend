import { useState, useEffect } from "react";
import { useNavigate } from "react-router"; // 👈 Change from react-router-dom to react-router
import CreateSale from "./CreateSale";
import TableSelectionModal from "./TableSelectionModal";

interface Table {
  id: number;
  table_number: string;
  table_name: string;
  status: "available" | "occupied" | "reserved";
}

export default function SalePageWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const navigate = useNavigate();

  // If table is selected, close modal and show sale page
  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setIsModalOpen(false);
  };

  // If modal is closed without selection, go back to dashboard
  const handleModalClose = () => {
    if (!selectedTable) {
      navigate("/sale");
    }
    setIsModalOpen(false);
  };

  // If no table selected, show modal
  if (!selectedTable) {
    return (
      <TableSelectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSelectTable={handleTableSelect}
        selectedTableId={null}
      />
    );
  }

  // If table is selected, show the sale page
  return <CreateSale preselectedTable={selectedTable} />;
}
