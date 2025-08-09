import { Routes, Route } from "react-router-dom";
import NotFound from "../pages/NotFound";
import LoginScreen from "../pages/Login";
import { Dashboard } from "../pages/index";
import PrivateRouter from "./PrivateRouter";
import PublicRouter from "./PublicRouter";



const MainRouter = () => {
    return (
        <Routes>
            {/* Public Route: For unauthenticated users.
              If a logged-in user visits /login, PublicRouter should redirect them to /.
            */}
            <Route
                path="/login"
                element={
                    <PublicRouter>
                        <LoginScreen />
                    </PublicRouter>
                }
            />
            <Route
                path="/"
                element={
                    <PrivateRouter><Dashboard /></PrivateRouter>
                }
            />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default MainRouter;
