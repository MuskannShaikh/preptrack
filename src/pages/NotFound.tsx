import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Target, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Target className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-6xl font-bold mb-4 gradient-text">404</h1>
      <p className="text-xl text-muted-foreground mb-8">Page not found</p>
      <Link to="/">
        <Button className="btn-primary">
          <Home className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
