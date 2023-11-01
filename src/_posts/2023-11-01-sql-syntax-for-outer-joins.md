---
title: SQL syntax for outer joins
summary: How to switch between syntax variants for joins in SQL.
---

I've recently been working on a project to migrate a system based on Oracle to
support SQL Server. Some of the existing SQL used syntax for outer joins which is
not supported on SQL Server, so I had to update it. This article describes how
to migrate SQL which uses the Oracle-specfic syntax to support both platforms.

## Example

In this article I'll use an example from a Human Resources database, which has
employees (`employee`) and departments (`department`). There is a one-to-many
relationship between the two (an employee is in one department and a department
contains many employees) defined by a foreign key from `employee.department_id`
to `department.id`.

## Inner joins

There are two different ways of writing inner joins in SQL.

The older syntax specifies both tables in the `FROM` clause and filters them in
the `WHERE` clause:

```sql
SELECT e.name, d.name
FROM employee e, department d
WHERE e.department_id = d.id
```

The newer syntax uses the more explicit `JOIN` and `ON` keywords:

```sql
SELECT e.name, d.name
FROM employee e
JOIN department d
ON e.department_id = d.id
```

The two are equivalent and will produce the same results (although performance
characteristics might vary depending on the database platform). Using an
explicit `JOIN` is generally regarded as best practice (e.g. see
<https://stackoverflow.com/a/1599201>).

## Outer joins

An outer join is used when the foreign key column on the child table
is nullable; in our example, this corresponds to `employee` having a nullable
`department_id` column (an employee might not belong to a department).

Both Oracle and SQL Server have support for outer joins using the `OUTER JOIN`
keyword. It comes in two flavours: `LEFT OUTER JOIN` and `RIGHT OUTER JOIN`.

```sql
SELECT e.name, d.name
FROM employee e
LEFT OUTER JOIN department d
ON e.department_id = d.id

SELECT e.name, d.name
FROM department d
RIGHT OUTER JOIN employee e
ON d.id = e.department_id
```

The `LEFT` or `RIGHT` denotes which side of the join is *required*. In our
example, the `employee` table is required, so when the `employee` table is
mentioned first we use a left join and when it's mentioned second we use a right
join.

Note that the `LEFT` or `RIGHT` is determined by the order in which the tables
are mentioned, not which side of the `=` sign they appear. It's possible
(although less readable in my opinion) to have the `ON` clause in a different
order to the table declarations; e.g.

```sql
SELECT e.name, d.name
FROM employee e
LEFT OUTER JOIN department d
ON d.id = e.department_id
```

In this case it's still a `LEFT` join because `employee` (the required table)
comes before `department`, and so `employee` is the left table.

On SQL Server it's not possible to define an outer join using the `WHERE`
syntax; your only option is to use an explicit `OUTER JOIN`. However Oracle has
its own special syntax for outer joins, which looks like this:

```sql
SELECT e.name, d.name
FROM employee e, department d
WHERE e.department_id = d.id (+)
```

The `(+)` symbol denotes which side of the join is *optional*. In our example,
the `department` table is optional so the `(+)` goes next to `d.id`.

## How to migrate

Here's how to migrate from the Oracle-specific syntax to use an `OUTER JOIN`.

- Using the `(+)` symbol, determine which of the tables is optional.
- This means that the other table is required.
- If the first table mentioned is required, use a `LEFT OUTER JOIN`.
- If the second table mentioned is required, use a `RIGHT OUTER JOIN`.

Let's use our example to illustrate this. We start with the Oracle syntax.

```sql
SELECT e.name, d.name
FROM employee e, department d
WHERE e.department_id = d.id (+)
```

The placement of the `(+)` tells us that `department` is optional. This means
that `employee` is required. As `employee` is mentioned first, we need a `LEFT
OUTER JOIN`.

```sql
SELECT e.name, d.name
FROM employee e
LEFT OUTER JOIN department d
ON e.department_id = d.id
```
