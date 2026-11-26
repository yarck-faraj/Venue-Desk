import { editProduct } from "../editors/product.js";
import { adjust, editStock, restock } from "../editors/stock.js";
import { stockItem } from "../views/shared/stock.js";
import { closeModal } from "../components/modal.js";
import { editOutlet } from "../editors/outlet.js";
import { deleteOutlet } from "./outlets.js";

export const stockActions = {
  newProduct: () => editProduct(null),
  editProduct: (d) => editProduct(d.id),
  newStock: () => editStock(null),
  restock: (d) => restock(d && d.id),
  adjust: (d) => adjust(d && d.id),
  stockItem: (d) => stockItem(d.id),
  stockRestock: (d) => {
    closeModal();
    restock(d.id);
  },
  stockAdjust: (d) => {
    closeModal();
    adjust(d.id);
  },
  stockEdit: (d) => {
    closeModal();
    editStock(d.id);
  },
  newOutlet: () => editOutlet(null),
  editOutlet: (d) => editOutlet(d.id),
  deleteOutlet: (d) => deleteOutlet(d.id),
};
