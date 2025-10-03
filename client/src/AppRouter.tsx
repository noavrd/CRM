import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layout/RootLayout";
import Home from "./pages/home/Home";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/auth/Login";

export default function AppRouter({ toggleMode }: { toggleMode: () => void }) {
  const router = createBrowserRouter([
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/",
      element: (
        <RequireAuth>
          <RootLayout toggleMode={toggleMode} />
        </RequireAuth>
      ),
      children: [{ index: true, element: <Home /> }],
    },
  ]);

  return <RouterProvider router={router} />;
}
