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
    "sap/m/Text"
], (Fragment, Controller, MessageToast, JSONModel, Filter, FilterOperator, ResourceModel, mobileLibrary, Dialog, Button, Label, Text) => {
    "use strict";
    const DialogType = mobileLibrary.DialogType;
    const ButtonType = mobileLibrary.ButtonType;
    return Controller.extend("websapui5.controller.HomePage", {

        onInit: function (oEvent) {
            this._formFragments = {};
            this._oSelectedEmployee = null;
            // ID Generate local JSONModel for gender

            if (!this.getView().getModel("newEmployeeModel")) {
                const oNewEmployeeModel = new JSONModel({
                    newEmployee: {
                        firstName: "",
                        lastName: "",
                        dateOfBirth: null, // Use null for DatePicker initially
                        gender: "",
                        mail: "", // Changed from 'email' to 'mail' to match XML binding
                        hireDate: null, // Use null for DatePicker initially
                        department: {
                            ID: ""
                        }, // Initialize nested objects
                        role: {
                            ID: ""
                        }, // Initialize nested objects
                        Avatar: "" // If you have an Avatar property
                    }
                });
                this.getView().setModel(oNewEmployeeModel, "newEmployeeModel");
            }
            // Set the model with a name

            // Initialize the filter model (if you haven't already, as discussed previously)
            const oFilterModel = new JSONModel({selectedDepartment: "", selectedLevel: ""});
            this.getView().setModel(oFilterModel, "filterModel"); // Set the model with a name

            const oGenderModel = new JSONModel([
                {
                    key: "Male",
                    text: "Male"
                }, {
                    key: "Female",
                    text: "Female"
                }, {
                    key: "Other",
                    text: "Other"
                }
            ]);
            this.getView().setModel(oGenderModel, "Genders");
            this._showFormFragment("List");
        },


        // UI status and checkup
        _pageButtonStatus: function (binput) {
            var oView = this.getView();

            // Show the appropriate action buttons
            oView.byId("create2").setVisible(! binput);
            oView.byId("view2").setVisible(binput);
            oView.byId("submit").setVisible(binput);
        },

        onEmailLiveChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sValue = oInput.getValue();
            // Basic email validation regex
            const bValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sValue);
            oInput.setValueState(bValid ? "None" : "Error");
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
            return new sap.m.GroupHeaderListItem({title: oGroup.key, upperCase: false});
        },
        onFilterChange: function () {
            this.applyTableFilters();
        },

        applyTableFilters: function () {
            const oTable = this.byId("employeeTable");

            const oBinding = oTable.getBinding("items");
            const aFilters = [];

            // Get selected Department filter
            const sDepartment = this.byId("departmentFilter").getSelectedKey();
            console.log("Selected Level Key:", sDepartment, "Type:", typeof sDepartment);
            if (sDepartment) {
                aFilters.push(new Filter("department/ID", FilterOperator.EQ, sDepartment));
            }

            // Get selected Level filter
            const sLevel = this.byId("levelFilter").getSelectedKey();
            console.log("Selected Level Key:", sLevel, "Type:", typeof sLevel);
            if (sLevel) {
                aFilters.push(new Filter("role/ID", FilterOperator.EQ, sLevel));
            }

            // Apply filters to the table binding
            oBinding.filter(aFilters);
        },


        // Button logic handle
        handleEmployeeDetailsPress: function (oEvent) {
            const oContext = oEvent.getSource().getBindingContext();
            // Store the currently selected employee data
            this._oSelectedEmployee = oContext;

            // Show the Display fragment
            this._showFormFragment("Display");
        },
        handleEmployeeListPress: function () {
            this._pageButtonStatus(false);
            this._showFormFragment("List");
        },
        // Handler for back button in the details page
        handleBackToListPress: function () {
            this._showFormFragment("List");
        },
        handleCreateEmployeePress: function () { // Get the JSON model that holds the newEmployee object
            const oNewEmployeeDataModel = this.getView().getModel("newEmployeeModel");

            // Reset the newEmployee object within that JSON model
            oNewEmployeeDataModel.setProperty("/newEmployee", {
                firstName: "",
                lastName: "",
                gender: "",
                department_ID: "", // Match the property used in your form binding
                role_ID: "", // Match the property used in your form binding
                dateOfBirth: null,
                hireDate: null,
                email: ""
            });

            this._pageButtonStatus(true);
            this._showFormFragment("Create"); // Show the fragment where the form fields are bound to this model
        },
        // handleCreateEmployeePress: function () {
        //     // Get the JSON model that holds the newEmployee object
        //     const oNewEmployeeDataModel = this.getView().getModel("newEmployeeModel");

        //     // Reset the newEmployee object within that JSON model
        //     oNewEmployeeDataModel.setProperty("/newEmployee", {
        //         firstName: "",
        //         lastName: "",
        //         gender: "",
        //         department_ID: "", // Match the property used in your form binding
        //         role_ID: "",       // Match the property used in your form binding
        //         dateOfBirth: null,
        //         hireDate: null,
        //         email: ""
        //     });

        //     this._pageButtonStatus(true);
        //     this._showFormFragment("Create"); // Show the fragment where the form fields are bound to this model
        // },
        // handleCreateEmployeePress: function () { // Reset the newEmployee object when opening the create form
        //     this.getView().getModel().setProperty("/newEmployee", {
        //         firstName: "",
        //         lastName: "",
        //         gender: "",
        //         department: {
        //             ID: ""
        //         },
        //         role: {
        //             ID: ""
        //         },
        //         dateOfBirth: null,
        //         hireDate: null,
        //         email: ""
        //     });
        //     this._pageButtonStatus(true);
        //     this._showFormFragment("Create");
        // },
        handleEditEmployeePress: function () {
            this._toggleButtonsAndView(true);
        },
        handleCancelPress: function () { // Restore the data
            if (this._oSelectedEmployeeContext) {
                this._oSelectedEmployeeContext.getModel().resetChanges([this._oSelectedEmployeeContext.getPath()]);
            }
            this._showFormFragment("Display");
            // var oModel = this.getView().getModel();
            // var oData = oModel.getData();

            // oData.Employees[0] = this._oSupplier;

            // oModel.setData(oData);
            // this._toggleButtonsAndView(false);
        },
        handleSaveEmployeePress: function () {
            const oODataModel = this.getView().getModel();
            if (oODataModel.hasPendingChanges()) {
                oODataModel.submitChanges({
                    success: () => {
                        MessageToast.show("Employee updated successfully!");
                        this._toggleButtonsAndView(false);
                        this._showFormFragment("Display"); // Quay lại chế độ xem sau khi lưu
                    },
                    error: (oError) => {
                        MessageToast.show("Error updating employee: " + oError.message);
                        console.error("Update error:", oError);
                    }
                });
            } else {
                MessageToast.show("No changes to save.");
                this._showFormFragment("Display");
            }
        },
        handleSubmitDialogPress: function () {
            if (!this.oSubmitDialog) {
                this.oSubmitDialog = new Dialog({
                    type: DialogType.Message,
                    title: "{i18n>ctitle}",
                    content: [new Label(
                            {text: "{i18n>ctext}"}
                        )],
                    beginButton: new Button(
                        {
                            type: ButtonType.Emphasized,
                            text: "{i18n>ok}",
                            press: function () {
                                this.oSubmitDialog.close();
                                this.handleSubmitPress();
                            }.bind(this)
                        }
                    ),
                    endButton: new Button(
                        {
                            type: ButtonType.Default,
                            text: "{i18n>cancel}",
                            press: function () {
                                this.oSubmitDialog.close();
                            }.bind(this)
                        }
                    )
                });
                this.getView().addDependent(this.oSubmitDialog);
            }
            this.oSubmitDialog.open();
        },

        // handleDeleteEmployeePress: function (oEvent) {
        //     const oBindingContext = oEvent.getSource().getBindingContext();
        //     const oModel = this.getView().getModel();

        //     if (oBindingContext) {
        //         new Dialog({
        //             type: DialogType.Message,
        //             title: "Confirm Delete",
        //             content: new Text(
        //                 {text: "Are you sure you want to delete this employee?"}
        //             ),
        //             beginButton: new Button(
        //                 {
        //                     type: ButtonType.Reject,
        //                     text: "Delete",
        //                     press: function () {
        //                         oModel.remove(oBindingContext.getPath(), {
        //                             success: function () {
        //                                 MessageToast.show("Employee deleted successfully!");
        //                                 oModel.refresh(); // Refresh model để cập nhật lại danh sách
        //                             },
        //                             error: function (oError) {
        //                                 const sErrorMessage = JSON.parse(oError.responseText).error.message;
        //                                 MessageToast.show("Error deleting employee: " + sErrorMessage);
        //                             }
        //                         });
        //                         this.oDeleteDialog.close();
        //                     }.bind(this)
        //                 }
        //             ),
        //             endButton: new Button(
        //                 {
        //                     type: ButtonType.Default,
        //                     text: "Cancel",
        //                     press: function () {
        //                         this.oDeleteDialog.close();
        //                     }.bind(this)
        //                 }
        //             )
        //         }).open();
        //     }
        // },
        // handleSubmitPress: function () {
        //     const oModel = this.getView().getModel();
        //     const oNewEmployeeData = oModel.getProperty("/newEmployee");

        //     // Basic validation (you can expand this)
        //     if (! oNewEmployeeData.firstName || ! oNewEmployeeData.lastName || ! oNewEmployeeData.Email) {
        //         MessageToast.show("Please fill in Name and Email fields.");
        //         return;
        //     }

        //     const oPayload = {
        //         firstName: oNewEmployeeData.firstName,
        //         lastName: oNewEmployeeData.lastName,
        //         dateOfBirth: oNewEmployeeData.dateOfBirth,
        //         gender: oNewEmployeeData.gender,
        //         email: oNewEmployeeData.email,
        //         hireDate: oNewEmployeeData.hireDate,
        //         department: {
        //             ID: oNewEmployeeData.department.ID
        //         },
        //         role: {
        //             ID: oNewEmployeeData.role.ID
        //         }
        //     };

        //     oModel.create("/Employees", oPayload, {
        //         success: function (oData, oResponse) {
        //             MessageToast.show("Employee created successfully!");
        //             this.byId("employeeTable").getBinding("items").refresh();
        //             this._pageButtonStatus(false);
        //             this._showFormFragment("List");
        //         }.bind(this),
        //         error: function (oError) {
        //             const sErrorMessage = oError.responseText ? JSON.parse(oError.responseText).error.message : oError.message;
        //             MessageToast.show("Error creating employee: " + sErrorMessage);
        //             console.error("Create error:", oError);
        //         }
        //     });

        //     // // Get current Employees array
        //     // const aEmployees = oModel.getProperty("/Employees") || [];

        //     // // Add new employee data to the array
        //     // // You might want to assign a unique ID here if your backend doesn't handle it
        //     // aEmployees.push(oNewEmployeeData);

        //     // // Update the model
        //     // oModel.setProperty("/Employees", aEmployees);

        //     // MessageToast.show("Employee created successfully!");

        //     // Navigate back to the list and hide the submit button
        //     this._pageButtonStatus(false);
        //     this._showFormFragment("List");
        // },
        handleSubmitPress: function () { // Get the ODataModel for backend interaction (create operation)
            const oODataModel = this.getView().getModel();

            // Get the JSONModel that holds the data for the new employee form
            const oNewEmployeeModel = this.getView().getModel("newEmployeeModel");

            // Check if the JSONModel exists
            if (! oNewEmployeeModel) {
                MessageToast.show("Error: New employee data model not found.");
                console.error("The 'newEmployeeModel' (JSONModel) is not set on the view. Please ensure it's initialized.");
                return;
            }

            // Get the data for the new employee from the JSONModel
            const oNewEmployeeData = oNewEmployeeModel.getProperty("/newEmployee");

            // Basic validation
            // FIX: Changed 'oNewEmployeeData.email' to 'oNewEmployeeData.mail'
            if (! oNewEmployeeData.firstName || ! oNewEmployeeData.lastName || ! oNewEmployeeData.mail) {
                MessageToast.show("Please fill in First Name, Last Name, and Email fields.");
                return;
            }

            // Construct the payload for the OData service
            const oPayload = {
                firstName: oNewEmployeeData.firstName,
                lastName: oNewEmployeeData.lastName,
                dateOfBirth: oNewEmployeeData.dateOfBirth,
                gender: oNewEmployeeData.gender,
                // FIX: Changed 'oNewEmployeeData.email' to 'oNewEmployeeData.mail' in payload
                email: oNewEmployeeData.mail, // This should now correctly map 'mail' from JSONModel to 'email' for OData
                hireDate: oNewEmployeeData.hireDate,
                // department_ID: oNewEmployeeData.department_ID,
                // role_ID: oNewEmployeeData.role_ID,
                department: {
                    ID: oNewEmployeeData.department.ID
                },
                role: {
                    ID: oNewEmployeeData.role.ID
                }
            };

            // Call the OData service to create a new employee
            oODataModel.create("/Employees", oPayload, {
                success: function (oData, oResponse) {
                    MessageToast.show("Employee created successfully!");
                    const oTable = this.byId("employeeTable");
                    if (oTable) {
                        const oBinding = oTable.getBinding("items");
                        if (oBinding) {
                            oBinding.refresh();
                        } else {
                            console.warn("Table items binding not found. Cannot refresh.");
                        }
                    } else {
                        console.warn("Employee table not found (ID: 'employeeTable'). Cannot refresh.");
                    }

                    // Reset the form after successful creation
                    oNewEmployeeModel.setProperty("/newEmployee", {
                        firstName: "",
                        lastName: "",
                        dateOfBirth: null,
                        gender: "",
                        mail: "", // Changed here too for consistency if resetting the model
                        hireDate: null,
                        department: {
                            ID: ""
                        },
                        role: {
                            ID: ""
                        },
                        Avatar: ""
                    });

                    this._pageButtonStatus(false);
                    this._showFormFragment("List");
                }.bind(this),
                error: function (oError) {
                    const sErrorMessage = oError.responseText ? JSON.parse(oError.responseText).error.message : oError.message;
                    MessageToast.show("Error creating employee: " + sErrorMessage);
                    console.error("Create error:", oError);
                }
            });
        },

        // Handler for navigating

        _toggleButtonsAndView: function (bEdit) {
            this._showFormFragment(bEdit ? "Change" : "Display");
        },
        _getFormFragment: function (sFragmentName) {
            var oView = this.getView();
            if (!this._formFragments[sFragmentName]) {
                this._formFragments[sFragmentName] = Fragment.load({
                    id: oView.getId(),
                    name: "websapui5.view.fragment.HomePage" + sFragmentName,
                    controller: this
                });
            }
            return this._formFragments[sFragmentName];
        },

        _showFormFragment: function (sFragmentName) {
            var oPage = this.byId("page");
            oPage.removeAllContent();

            this._getFormFragment(sFragmentName).then(function (oFragmentContent) {
                oPage.insertContent(oFragmentContent);

                if ((sFragmentName === "Display" || sFragmentName === "Change") && this._oSelectedEmployee) {
                    const oModel = this._oSelectedEmployee.getModel();
                    let sPath = this._oSelectedEmployee.getPath();

                    const aMatches = sPath.match(/\((.*?)\)/);
                    if (aMatches && aMatches[1] && aMatches[1].indexOf("'") === -1 && isNaN(aMatches[1])) {
                        sPath = sPath.replace(`(${
                            aMatches[1]
                        })`, `('${
                            aMatches[1]
                        }')`);
                    }

                    oFragmentContent.setModel(oModel);
                    oFragmentContent.bindElement(sPath);

                } else if ((sFragmentName === "Display" || sFragmentName === "Change") && !this._oSelectedEmployee) {
                    MessageToast.show("No employee selected to display.");
                    this.handleBackToListPress();
                }

                if (sFragmentName === "List") {
                    this.applyTableFilters();
                }
            }.bind(this));
        },
    });
});
