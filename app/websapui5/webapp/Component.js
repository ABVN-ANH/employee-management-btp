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

            // Detect user role from OData V4 service (CAP authentication)
            var oUserRole = "Viewer";
            if (window && window.user && window.user.roles) {
                if (window.user.roles.Admin) {
                    oUserRole = "Admin";
                }
            } else if (typeof sap !== 'undefined' && sap.ushell && sap.ushell.Container && sap.ushell.Container.getUser) {
                // Fiori Launchpad
                var oUser = sap.ushell.Container.getUser();
                if (oUser && oUser.getRoles) {
                    var aRoles = oUser.getRoles();
                    if (aRoles && aRoles.indexOf("Admin") !== -1) {
                        oUserRole = "Admin";
                    }
                }
            }
            this.setModel(new JSONModel({ userRole: oUserRole }), "app");
            console.log("userRole in app model:", this.getModel("app").getProperty("/userRole"));

            // enable routing
            this.getRouter().initialize();
        }
    });
});
