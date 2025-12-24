import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layout/RootLayout";
import Home from "./pages/home/Home";
import RequireAuth from "./components/RequireAuth";
import Login from "./pages/auth/Login";
import LeadsPage from "./pages/leads/LeadsPage";
import ProjectsPage from "./pages/projects/ProjectsPage";
import TasksPage from "./pages/tasks/TasksPage";
import VisitsPage from "./pages/visits/VisitsPage";
import EventsPage from "./pages/events/EventsPage";
import ProjectsMapPage from "./pages/projects/ProjectsMapPage";
import ProjectDetailsPage from "./pages/projects/ProjectDetailsPage";
import TaskDetailsPage from "./pages/tasks/TaskDetailsPage";

export default function AppRouter({ toggleMode }: { toggleMode: () => void }) {
  const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    {
      path: "/",
      element: (
        <RequireAuth>
          <RootLayout toggleMode={toggleMode} />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <Home /> },
        { path: "leads", element: <LeadsPage /> },
        { path: "projects", element: <ProjectsPage /> },
        { path: "tasks", element: <TasksPage /> },
        { path: "visits", element: <VisitsPage /> },
        { path: "events", element: <EventsPage /> },
        { path: "projects/map", element: <ProjectsMapPage /> },
        { path: "projects/:id", element: <ProjectDetailsPage /> },
        { path: "tasks/:id", element: <TaskDetailsPage /> },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}
