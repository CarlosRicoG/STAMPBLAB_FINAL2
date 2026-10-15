import React from "react";
     
const StockNotificationBanner = () => {
    return (
        <div
            style={{
                position: "fixed",
                bottom: "20px",
                right: "20px",
                background: "#ffcc00",
                padding: "12px 20px",
                borderRadius: "8px",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                fontWeight: "bold",
                zIndex: 9999
            }}
        >
            Notificaciones de stock aquí
        </div>
    );
};

export default StockNotificationBanner;
