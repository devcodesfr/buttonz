import { useEffect } from "react";
import ButtonzPage from "@/pages/buttonz";

export default function App() {
  useEffect(() => {
    document.title = "Buttonz";
  }, []);

  return <ButtonzPage />;
}
