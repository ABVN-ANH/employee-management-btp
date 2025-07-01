sap.ui.define([
    "sap/ui/core/UIComponent", "websapui5/model/models", "sap/ui/model/json/JSONModel", "sap/ui/model/resource/ResourceModel"
], (UIComponent, models, JSONModel, ResourceModel) => {
    "use strict";

    return UIComponent.extend("websapui5.Component", {
        metadata: {
            manifest: "json",
            interfaces: ["sap.ui.core.IAsyncContentCreation"]
        },

        init() { // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments)

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // Fetch user info from backend (CAP service)
            var that = this;
            var oAppModel = new JSONModel({ userRole: "Viewer" }); // Default is Viewer
            this.setModel(oAppModel, "app");
            console.log("[DEBUG][Component.js] Set app model with userRole:", oAppModel.getProperty("/userRole"));

            fetch("/odata/v4/employee-management/userInfo", { credentials: "include" })
                .then(function(response) {
                    if (!response.ok) throw new Error("Failed to fetch user info");
                    return response.json();
                })
                .then(function(data) {
                    // OData function returns { value: { id, roles, ... } }
                    var userData = data.value || data;
                    console.log("[DEBUG][Component.js] /userInfo response:", userData, "roles type:", typeof userData.roles, "roles value:", userData.roles);
                    var oUserRole = "Viewer";
                    if (userData && userData.roles) {
                        if (
                            (Array.isArray(userData.roles) && userData.roles.includes("Admin")) ||
                            (typeof userData.roles === "object" && (userData.roles.Admin === 1 || userData.roles.Admin === true))
                        ) {
                            oUserRole = "Admin";
                        }
                    }
                    oAppModel.setProperty("/userRole", oUserRole);
                    console.log("[DEBUG][Component.js] userRole in app model (from backend):", oUserRole);
                })
                .catch(function(err) {
                    console.warn("[DEBUG][Component.js] Could not fetch user info, defaulting to Viewer", err);
                });

            // enable routing
            this.getRouter().initialize();
        }
    });
});
