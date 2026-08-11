import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Button from "@/components/ui/Button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-grey-500 mb-2">404</h1>
        <p className="text-base text-grey-300 mb-5">Oops! Page not found</p>
        <Button variant="primary" onClick={() => { window.location.href = "/"; }}>
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
