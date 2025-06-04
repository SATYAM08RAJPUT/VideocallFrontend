import "./App.css";
import VideoCall from "./Video call/videocall";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { v4 as uuid } from "uuid";
import Home from "./Video call/home ";
function App() {
  return (
    <>
      <Router>
        <Routes>
          {" "}
          <Route path="/" element={<Home />} />
          <Route path="/" element={<Navigate to={`/room/${uuid()}`} />} />
          <Route path="/room/:roomId" element={<VideoCall />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
