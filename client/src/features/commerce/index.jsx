import Cart from "./Cart";
import Checkout from "./Checkout";
import { Orders, OrderDetail } from "./Orders";
export const featureName = "commerce";
export const routes = [
  { path: "/cart", element: <Cart /> },
  { path: "/checkout", element: <Checkout /> },
  { path: "/orders", element: <Orders /> },
  { path: "/orders/:id", element: <OrderDetail /> },
  { path: "/admin/orders", admin: true, element: <Orders admin /> },
  { path: "/admin/orders/:id", admin: true, element: <OrderDetail admin /> },
];