import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layout/RootLayout";
import Home from "./pages/home/Home";

export default function AppRouter({ toggleMode }: { toggleMode: () => void }) {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout toggleMode={toggleMode} />,
      children: [{ index: true, element: <Home /> }],
    },
  ]);

  return <RouterProvider router={router} />;
}
