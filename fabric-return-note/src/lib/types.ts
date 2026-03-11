export type FabricReturnStatus = "PENDING" | "RECEIVED";

export type FabricReturnNote = {
  id: string;
  fabricCode: string;
  date: string; // YYYY-MM-DD
  vendorName: string;
  styleCode: string;
  receivedQuantity: number;
  returnedQuantity: number;
  returnReason: string;
  challanNo: string;
  status: FabricReturnStatus;
  createdAt: number;
  receivedAt?: number;
};

