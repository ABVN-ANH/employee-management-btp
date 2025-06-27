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

            // enable routing
            this.getRouter().initialize();
        }
    });
});
