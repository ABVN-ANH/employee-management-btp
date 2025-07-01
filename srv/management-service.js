const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {
    const { Employees, Roles } = this.entities;

    this.on('READ', Employees, async (req, next) => {
        const user = req.user ?? cds.User.default;

        console.log('ᓚᘏᗢ - User Info:', user);

        const employees = await next();

        if (!employees || req.query.SELECT.count) {
            return employees;
        }

        const employeeList = Array.isArray(employees) ? employees : [employees];

        await Promise.all(employeeList.map(async (emp) => {
            const salary = await calculateSalary(req, emp.role_ID, emp.hireDate);
            if (salary !== null)
                emp.salary = salary;


        }));

        return employees;
    });

    this.on('calculateEmployeeSalary', async (req) => {
        const employeeId = req.data.ID;

        if (!employeeId) {
            return req.error(400, 'Please provide an employee ID.');
        }
        // const emp = await SELECT.one.from(Employees).where({ ID: employeeId });
        const employee = await cds.transaction(req).run(SELECT.one.from(Employees).columns('*').where({ ID: employeeId }));

        if (!employee) {
            return req.error(404, `Employee with ID ${employeeId} not found.`);
        }

        const salary = await calculateSalary(req, employee.role_ID, employee.hireDate);

        if (salary === null) {
            return req.error(400, `Cannot calculate salary for employee with ID ${employeeId}.`);
        }

        return salary;
    });

    // Calculate Salary
    async function calculateSalary(req, roleId, hireDate) {
        if (!roleId || !hireDate)
            return null;


        const role = await cds.transaction(req).run(SELECT.one.from(Roles).where({ ID: roleId }));

        if (!role)
            return null;


        const hire = new Date(hireDate);
        const now = new Date();

        // Tính số năm làm việc, chỉ tính tròn năm (không tính tháng/ngày lẻ)
        let years = now.getFullYear() - hire.getFullYear();
        if (
            now.getMonth() < hire.getMonth() ||
            (now.getMonth() === hire.getMonth() && now.getDate() < hire.getDate())
        ) {
            years--;
        }
        years = Math.max(0, years);
        const bonus = years * 1000;

        return parseFloat(role.baseSalary) + bonus;
    }

    this.on('userInfo', (req) => {
        const user = req.user || cds.User.default;
        let roles = user.roles;
        if (roles && !Array.isArray(roles)) {
            roles = Object.keys(roles).filter(r => roles[r]);
        }
        return {
            id: user.id,
            roles: roles,
            attr: user.attr
        };
    });
});
