import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/routes";
import InstalarApp from "./components/InstalarApp";


function App() {
  return (

    <BrowserRouter>
      <AppRoutes></AppRoutes>
      <InstalarApp />
    </BrowserRouter>

  )
}

export default App;
