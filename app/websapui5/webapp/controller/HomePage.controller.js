sap.ui.define([
    "sap/ui/core/Fragment",
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/resource/ResourceModel",
    "sap/m/library",
    "sap/m/Dialog",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Text",
    "sap/m/MessageBox"
], (Fragment, Controller, MessageToast, JSONModel, Filter, FilterOperator, ResourceModel, mobileLibrary, Dialog, Button, Label, Text, MessageBox) => {
    "use strict";

    const { DialogType, ButtonType } = mobileLibrary;

    function toISODateString(dateValue) {
        if (!dateValue) return null;
        if (dateValue instanceof Date) {
            return dateValue.toISOString().slice(0, 10);
        }
        const parsed = new Date(dateValue);
        if (!isNaN(parsed)) {
            return parsed.toISOString().slice(0, 10);
        }
        const match = dateValue.match(/(\d{2}) ([A-Za-z]+), (\d{4})/);
        if (match) {
            const [, day, monthName, year] = match;
            const month = new Date(`${monthName} 1, 2000`).getMonth() + 1;
            return `${year}-${String(month).padStart(2, '0')}-${day}`;
        }
        return dateValue;
    }

    function getResourceBundle(controller) {
        return controller.getOwnerComponent().getModel("i18n").getResourceBundle();
    }

    function getErrorMessage(controller, oError) {
        try {
            if (oError.responseText) {
                const oErrorDetails = JSON.parse(oError.responseText);
                return oErrorDetails.error.message;
            }
        } catch (e) {}
        return oError.message || getResourceBundle(controller).getText("unknownError");
    }

    return Controller.extend("websapui5.controller.HomePage", {
        onInit: function () {
            this._formFragments = {};
            this._oSelectedEmployeeContext = null;
            if (!this.getView().getModel("newEmployeeModel")) {
                this.getView().setModel(new JSONModel({
                    newEmployee: {
                        firstName: "",
                        lastName: "",
                        dateOfBirth: null,
                        gender: "",
                        email: "",
                        hireDate: null,
                        department: { ID: "" },
                        role: { ID: "" }
                    }
                }), "newEmployeeModel");
            }
            this.getView().setModel(new JSONModel({ selectedDepartment: "", selectedLevel: "" }), "filterModel");
            this.getView().setModel(new JSONModel([
                { key: "Male", text: "Male" },
                { key: "Female", text: "Female" },
                { key: "Other", text: "Other" }
            ]), "Genders");
            this.getView().setModel(new JSONModel({ calculatedSalary: null, calculatedSalaryVisible: false }), "view");
            this.getView().setModel(this.getOwnerComponent().getModel("app"), "app");
            this._showFormFragment("List");
        },

        _setPageButtonStatus: function (bIsCreateOrEdit) {
            const oView = this.getView();
            oView.byId("submit").setVisible(bIsCreateOrEdit);
        },

        onEmailLiveChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sValue = oInput.getValue();
            const bValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sValue);
            oInput.setValueState(bValid ? "None" : "Error");
            oInput.setValueStateText(bValid ? "" : getResourceBundle(this).getText("invalidEmail"));
        },

        formatLevelState: function (sLevel) {
            const levelStateMap = {
                "Junior Specialist": "Indication15",
                "Associate Expert": "Indication13",
                "Specialist": "Indication05",
                "Senior": "Indication07",
                "Expert": "Indication02",
                "Intern": "Indication12",
                "Viewer": "Indication18",
                "Admin": "Indication17"
            };
            return levelStateMap[sLevel] || "None";
        },

        createGroupHeader: function (oGroup) {
            return new sap.m.GroupHeaderListItem({ title: oGroup.key, upperCase: false });
        },

        onFilterChange: function () {
            this.applyTableFilters();
        },

        applyTableFilters: function () {
            const oTable = this.byId("employeeTable");
            if (!oTable) return;
            const oBinding = oTable.getBinding("items");
            if (!oBinding) return;
            const aFilters = [];
            const sDepartment = this.byId("departmentFilter").getSelectedKey();
            const sLevel = this.byId("levelFilter").getSelectedKey();
            if (sDepartment) aFilters.push(new Filter("department/ID", FilterOperator.EQ, sDepartment));
            if (sLevel) aFilters.push(new Filter("role/ID", FilterOperator.EQ, sLevel));
            oBinding.filter(aFilters);
        },

        handleEmployeeDetailsPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            this._oSelectedEmployeeContext = oContext;
            this._oSelectedEmployeeId = oContext.getObject().ID;
            this._showFormFragment("Display");
        },

        handleEmployeeListPress: function () {
            this._setPageButtonStatus(false);
            this._showFormFragment("List");
        },

        handleBackToListPress: function () {
            const oViewModel = this.getView().getModel("view");
            if (oViewModel) {
                oViewModel.setProperty("/calculatedSalary", null);
                oViewModel.setProperty("/calculatedSalaryVisible", false);
            }
            this._showFormFragment("List");
        },

        handleCreateEmployeePress: function () {
            this.getView().getModel("newEmployeeModel").setProperty("/newEmployee", {
                firstName: "",
                lastName: "",
                dateOfBirth: null,
                gender: "",
                email: "",
                hireDate: null,
                department: { ID: "" },
                role: { ID: "" }
            });
            this._setPageButtonStatus(true);
            this._showFormFragment("Create");
        },

        handleEditEmployeePress: function () {
            this._setPageButtonStatus(false);
            this._showFormFragment("Change");
        },

        handleCancelPress: function () {
            const oODataModel = this.getView().getModel();
            if (this._oSelectedEmployeeContext && oODataModel.hasPendingChanges()) {
                oODataModel.resetChanges([this._oSelectedEmployeeContext.getPath()]);
                MessageToast.show(getResourceBundle(this).getText("{i18n>changesCancelled}"));
            }
            this._showFormFragment("Display");
        },

        handleSaveEmployeePress: function () {
            const oODataModel = this.getView().getModel();
            if (oODataModel.hasPendingChanges()) {
                oODataModel.submitChanges({
                    success: () => {
                        MessageToast.show(getResourceBundle(this).getText("{i18n>employeeUpdateSuccess}"));
                        this._showFormFragment("Display");
                    },
                    error: (oError) => {
                        const sErrorMessage = getErrorMessage(this, oError);
                        MessageToast.show(getResourceBundle(this).getText("{i18n>employeeUpdateError}", [sErrorMessage]));
                        console.error("Update error:", oError);
                    }
                });
            } else {
                MessageToast.show(getResourceBundle(this).getText("{i18n>noChangesToSave}"));
                this._showFormFragment("Display");
            }
        },

        handleSubmitDialogPress: function () {
            if (!this.oSubmitDialog) {
                this.oSubmitDialog = new Dialog({
                    type: DialogType.Message,
                    title: getResourceBundle(this).getText("{i18n>ctitle}"),
                    content: [new Label({ text: getResourceBundle(this).getText("{i18n>ctext}") })],
                    beginButton: new Button({
                        type: ButtonType.Emphasized,
                        text: getResourceBundle(this).getText("{i18n>ok}"),
                        press: () => {
                            this.oSubmitDialog.close();
                            this.handleSubmitPress();
                        }
                    }),
                    endButton: new Button({
                        type: ButtonType.Default,
                        text: getResourceBundle(this).getText("{i18n>cancel}"),
                        press: () => {
                            this.oSubmitDialog.close();
                        }
                    })
                });
                this.getView().addDependent(this.oSubmitDialog);
            }
            this.oSubmitDialog.open();
        },

        handleSubmitPress: function () {
            const oODataModel = this.getView().getModel();
            const oNewEmployeeModel = this.getView().getModel("newEmployeeModel");
            if (!oNewEmployeeModel) {
                MessageToast.show(getResourceBundle(this).getText("{i18n>newEmployeeModelNotFound}"));
                console.error("{i18n>newEmployeeModelNotFound}");
                return;
            }
            const oNewEmployeeData = oNewEmployeeModel.getProperty("/newEmployee");
            if (!oNewEmployeeData.firstName || !oNewEmployeeData.lastName || !oNewEmployeeData.email ||
                !oNewEmployeeData.gender || !oNewEmployeeData.dateOfBirth || !oNewEmployeeData.hireDate ||
                !oNewEmployeeData.department || !oNewEmployeeData.department.ID ||
                !oNewEmployeeData.role || !oNewEmployeeData.role.ID) {
                MessageToast.show(getResourceBundle(this).getText("{i18n>missingRequiredFields}"));
                return;
            }
            const oPayload = {
                firstName: oNewEmployeeData.firstName,
                lastName: oNewEmployeeData.lastName,
                dateOfBirth: toISODateString(oNewEmployeeData.dateOfBirth),
                gender: oNewEmployeeData.gender,
                email: oNewEmployeeData.email,
                hireDate: toISODateString(oNewEmployeeData.hireDate),
                department: { ID: oNewEmployeeData.department.ID },
                role: { ID: oNewEmployeeData.role.ID }
            };
            const oListBinding = oODataModel.bindList("/Employees");
            oListBinding.create(oPayload).created().then(() => {
                MessageToast.show(getResourceBundle(this).getText("{i18n>employeeCreated}"));
                this._refreshEmployeeTable();
                this._resetNewEmployeeForm();
                this._showFormFragment("List");
            }).catch((oError) => {
                MessageBox.error(getErrorMessage(this, oError));
            });
        },

        onSelectionChange: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("listItem") || oEvent.getParameter("row");
            if (oSelectedItem) {
                this._oSelectedEmployeeContext = oSelectedItem.getBindingContext();
                this._oSelectedEmployeeId = this._oSelectedEmployeeContext.getObject().ID;
            } else {
                this._oSelectedEmployeeContext = null;
                this._oSelectedEmployeeId = null;
            }
        },

        handleDeleteDialog: function (oEvent) {
            if (oEvent && oEvent.getSource) {
                var oContext = oEvent.getSource().getBindingContext();
                if (oContext) {
                    this._oSelectedEmployeeContext = oContext;
                }
            }
            if (!this.oDeleteDialog) {
                this.oDeleteDialog = new Dialog({
                    type: DialogType.Message,
                    title: getResourceBundle(this).getText("{i18n>ctitle}"),
                    content: [new Label({ text: getResourceBundle(this).getText("{i18n>dtext}") })],
                    beginButton: new Button({
                        type: ButtonType.Emphasized,
                        text: getResourceBundle(this).getText("{i18n>ok}"),
                        press: () => {
                            this.oDeleteDialog.close();
                            this.onDeleted();
                        }
                    }),
                    endButton: new Button({
                        type: ButtonType.Default,
                        text: getResourceBundle(this).getText("{i18n>cancle}"),
                        press: () => {
                            this.oDeleteDialog.close();
                        }
                    })
                });
                this.getView().addDependent(this.oDeleteDialog);
            }
            this.oDeleteDialog.open();
        },

        onDeleted: function () {
            const oSelectedEmployeeContext = this._oSelectedEmployeeContext;
            if (!oSelectedEmployeeContext) {
                MessageToast.show(getResourceBundle(this).getText("{i18n>noEmployeeSelected}"));
                console.warn("No employee context selected for deletion.");
                return;
            }
            oSelectedEmployeeContext.delete().then(() => {
                MessageToast.show(getResourceBundle(this).getText("{i18n>employeeDeleteSuccess}"));
                this._refreshEmployeeTable();
                this._oSelectedEmployeeContext = null;
                this._showFormFragment && this._showFormFragment("List");
            }).catch((oError) => {
                const sErrorMessage = getErrorMessage(this, oError) || "{i18n>deleteFailed}";
                MessageToast.show(getResourceBundle(this).getText("{i18n>deleteFailed}", [sErrorMessage]));
                console.error("{i18n>deleteFailed}", oError);
            });
        },

        handleCalculateSalary: async function () {
            try {
                const oView = this.getView();
                const oModel = oView.getModel();
                if (!oModel) {
                    MessageBox.error(getResourceBundle(this).getText("{i18n>odataModelNotAvailable}"));
                    return;
                }
                const sID = this._oSelectedEmployeeId;
                if (!sID) {
                    MessageBox.error(getResourceBundle(this).getText("{i18n>noEmployeeSelected}"));
                    return;
                }
                const sPath = `/calculateEmployeeSalary(ID='${sID}')`;
                const oBindingContext = oModel.bindContext(sPath, null);
                const oResult = await oBindingContext.requestObject();
                const fSalary = oResult?.value;
                let oViewModel = oView.getModel("view");
                if (!oViewModel) {
                    oViewModel = new JSONModel();
                    oView.setModel(oViewModel, "view");
                }
                oViewModel.setProperty("/calculatedSalary", fSalary);
                oViewModel.setProperty("/calculatedSalaryVisible", true);
            } catch (err) {
                let sErrorMessage = "An unknown error occurred.";
                if (err && err.message) {
                    sErrorMessage = err.message;
                } else if (err && err.responseText) {
                    try {
                        const oErrorDetails = JSON.parse(err.responseText);
                        sErrorMessage = oErrorDetails.error.message;
                    } catch (parseError) {
                        sErrorMessage = "Error parsing server response: " + err.responseText;
                    }
                }
                MessageBox.error(getResourceBundle(this).getText("{i18n>errorCalculatingSalary}", [sErrorMessage]));
                console.error("{i18n>errorCalculatingSalary}", err);
            }
        },

        _refreshEmployeeTable: function () {
            const oTable = this.byId("employeeTable");
            if (oTable) {
                const oBinding = oTable.getBinding("items");
                if (oBinding) {
                    oBinding.refresh();
                }
            }
        },

        _resetNewEmployeeForm: function () {
            const oNewEmployeeModel = this.getView().getModel("newEmployeeModel");
            if (oNewEmployeeModel) {
                oNewEmployeeModel.setProperty("/newEmployee", {
                    firstName: "",
                    lastName: "",
                    dateOfBirth: null,
                    gender: "",
                    email: "",
                    hireDate: null,
                    department: { ID: "" },
                    role: { ID: "" }
                });
            }
        },

        _getFormFragment: function (sFragmentName) {
            const oView = this.getView();
            if (!this._formFragments[sFragmentName]) {
                this._formFragments[sFragmentName] = Fragment.load({
                    id: oView.getId(),
                    name: `websapui5.view.fragment.HomePage${sFragmentName}`,
                    controller: this
                });
            }
            return this._formFragments[sFragmentName];
        },

        _showFormFragment: function (sFragmentName) {
            const oPage = this.byId("page");
            if (!oPage) return;
            oPage.removeAllContent();
            const oViewModel = this.getView().getModel("view");
            if (oViewModel) {
                oViewModel.setProperty("/isCreateMode", sFragmentName === "Create");
            }
            this._getFormFragment(sFragmentName).then((oFragmentContent) => {
                oPage.insertContent(oFragmentContent);
                if ((sFragmentName === "Display" || sFragmentName === "Change") && this._oSelectedEmployeeContext) {
                    const oModel = this._oSelectedEmployeeContext.getModel();
                    let sPath = this._oSelectedEmployeeContext.getPath();
                    const aMatches = sPath.match(/\((.*?)\)/);
                    if (aMatches && aMatches[1] && aMatches[1].indexOf("'") === -1 && isNaN(aMatches[1])) {
                        sPath = sPath.replace(`(${aMatches[1]})`, `('${aMatches[1]}')`);
                    }
                    oFragmentContent.setModel(oModel);
                    oFragmentContent.bindElement(sPath);
                } else if ((sFragmentName === "Display" || sFragmentName === "Change") && !this._oSelectedEmployeeContext) {
                    MessageToast.show(getResourceBundle(this).getText("{i18n>noEmployeeSelected}"));
                    this.handleBackToListPress();
                }
                if (sFragmentName === "List") {
                    this.applyTableFilters();
                }
                this._setPageButtonStatus(sFragmentName === "Create" || sFragmentName === "Change");
            }).catch((oError) => {
                MessageToast.show(getResourceBundle(this).getText("fragmentLoadError", [sFragmentName]));
                console.error(`Error loading fragment ${sFragmentName}:`, oError);
            });
        }
    });
});