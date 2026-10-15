import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/routes";


function App() {
  return (

    <BrowserRouter>
      <AppRoutes></AppRoutes>
    </BrowserRouter>

  )
}

export default App;
