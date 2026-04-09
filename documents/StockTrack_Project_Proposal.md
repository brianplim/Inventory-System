WEB-BASED INVENTORY MANAGEMENT SYSTEM FOR PRODUCT MONITORING AND STOCK CONTROL

ACES TAGUM COLLEGE, INC.
Mankilam, Tagum City
Institute of Information Communications Technology

A Proposed System Submitted by:
[Insert Proponent Name]
[Insert Instructor Full Name]
April 2026

INTRODUCTION

Project Overview

The proposed system, titled StockTrack Inventory Management System, is a web-based application designed to help small stores, campus units, and startup businesses organize product information and monitor stock levels in one place. Many inventory processes are still handled through handwritten logs or scattered spreadsheet files, which makes it difficult to search items quickly, maintain accurate quantities, and keep product details consistent. These manual practices often result in delayed updates, duplicate entries, overlooked low-stock items, and poor visibility of overall inventory value.

To address these issues, the proposed system uses a centralized Laravel-based product management workflow where users can add, view, edit, search, and delete product records. Each product entry stores a stock keeping unit, product name, category, price, quantity, date added, optional image, and descriptive notes. The system also presents summary information such as total number of products, low-stock items, total units on hand, and computed inventory value to support faster day-to-day monitoring.

The study focuses on improving the accuracy, accessibility, and organization of inventory records through a simple and responsive browser interface. By reducing reliance on manual encoding and fragmented tracking methods, the project aims to support better operational control and quicker decision-making for users who need an affordable and easy-to-maintain inventory solution.

Objectives of the Study

The general objective of the study is to design and develop a web-based inventory management system that centralizes product information and supports accurate stock monitoring. Specifically, the project aims to achieve the following objectives in Input, Process, and Output order:

1. To capture complete and validated product information, including SKU, name, category, price, quantity, date added, image, and description, through a structured input form.
2. To process product records through create, read, update, delete, and search functions with validation rules that help maintain data consistency and prevent duplicate SKU entries.
3. To generate organized output in the form of a searchable product catalog, individual product detail pages, low-stock indicators, and dashboard statistics for total products, total units, and inventory value.
4. To provide a usable browser-based interface that allows inventory monitoring tasks to be completed more efficiently than manual product listing and stock checking.

Scope and Limitation

The scope of the proposed system is limited to product inventory management within a single web application environment. The system covers the encoding, storage, updating, searching, viewing, and deletion of product records. It also includes dashboard-style summaries, image upload support for items, and automatic identification of low-stock products based on current quantity values. The project is intended for academic demonstration and for small-scale inventory monitoring where users primarily need organized product records and stock visibility.

The study does not include advanced enterprise features such as supplier management, purchase orders, sales transactions, barcode scanning, role-based user accounts, audit logs, report export, or multi-branch synchronization. Because of these limitations, the proposed system should be understood as a focused inventory catalog and stock-monitoring solution rather than a full end-to-end retail management platform.

Functional and Non-functional Requirements

This section presents the expected functional and non-functional requirements of the proposed system.

Functional Requirements

1. The system shall allow users to create a new product record with SKU, name, category, price, quantity, date added, image, and description fields.
2. The system shall validate required inputs and enforce SKU uniqueness before saving or updating a product record.
3. The system shall display a paginated list of products with searchable fields for product name, SKU, and category.
4. The system shall allow users to view the complete details of a selected product, including image, pricing, stock quantity, and description.
5. The system shall allow users to edit existing product information and remove or replace product images when necessary.
6. The system shall allow users to delete obsolete product records and update the displayed inventory statistics accordingly.
7. The system shall compute and display dashboard statistics for total products, low-stock products, total units, and estimated inventory value.

Non-Functional Requirements

1. The system shall provide a simple and responsive user interface that can be accessed through modern desktop and mobile browsers.
2. The system shall return product listing and search results within an acceptable time under normal small-business or classroom data volumes.
3. The system shall preserve data integrity through server-side validation and controlled handling of uploaded product images.
4. The system shall be maintainable through organized Laravel MVC structure, database migrations, and reusable Blade view components.
5. The system shall be reliable enough to support repeated add, edit, delete, and search operations without corrupting stored product records.

References

[1] Laravel LLC, "Laravel Documentation," Available: https://laravel.com/docs. Accessed: April 9, 2026.
[2] Bootstrap Team, "Bootstrap Documentation," Available: https://getbootstrap.com/docs/. Accessed: April 9, 2026.
[3] P. K. Nair and V. Nair, Scientific Writing and Communication in Agriculture and Natural Resources. Springer International Publishing, 2014.
