<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StockTrack Inventory</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        :root {
            --brand-900: #123524;
            --brand-700: #2f6b52;
            --brand-500: #5d9b7b;
            --brand-100: #edf7f0;
            --accent: #f0b35b;
            --page: #f5f1e8;
            --card: rgba(255, 255, 255, 0.88);
            --text: #1f2937;
            --muted: #6b7280;
            --danger-soft: #fde7e7;
            --warning-soft: #fff3d8;
        }

        body {
            min-height: 100vh;
            background:
                radial-gradient(circle at top left, rgba(240, 179, 91, 0.35), transparent 30%),
                radial-gradient(circle at top right, rgba(93, 155, 123, 0.25), transparent 28%),
                linear-gradient(180deg, #fcfbf8 0%, var(--page) 100%);
            color: var(--text);
        }

        .brand-shell {
            position: relative;
        }

        .brand-nav {
            background: rgba(18, 53, 36, 0.92);
            backdrop-filter: blur(12px);
        }

        .brand-logo {
            letter-spacing: 0.04em;
        }

        .hero-card,
        .glass-card {
            background: var(--card);
            border: 1px solid rgba(255, 255, 255, 0.7);
            box-shadow: 0 18px 50px rgba(18, 53, 36, 0.08);
            backdrop-filter: blur(10px);
        }

        .hero-card {
            border-radius: 1.5rem;
        }

        .glass-card {
            border-radius: 1.25rem;
        }

        .stat-chip {
            border-radius: 1rem;
            background: rgba(237, 247, 240, 0.95);
            border: 1px solid rgba(93, 155, 123, 0.15);
        }

        .table thead th {
            background: #173f2b;
            color: #fff;
            border-bottom: 0;
        }

        .product-thumb {
            width: 64px;
            height: 64px;
            object-fit: cover;
            border-radius: 1rem;
            background: #eef2ef;
        }

        .product-placeholder {
            width: 64px;
            height: 64px;
            border-radius: 1rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #d8eadc, #f3d9b7);
            color: var(--brand-900);
            font-weight: 700;
        }

        .low-stock {
            background: var(--warning-soft);
        }

        .danger-soft {
            background: var(--danger-soft);
        }

        .badge-soft {
            background: rgba(93, 155, 123, 0.14);
            color: var(--brand-900);
        }

        .page-link {
            color: var(--brand-900);
        }

        .page-item.active .page-link {
            background-color: var(--brand-700);
            border-color: var(--brand-700);
        }
    </style>
</head>
<body>
    <div class="brand-shell">
        <nav class="navbar navbar-expand-lg brand-nav navbar-dark py-3 mb-4">
            <div class="container">
                <a class="navbar-brand brand-logo fw-bold" href="{{ route('products.index') }}">StockTrack</a>
                <span class="navbar-text text-white-50">Inventory Management System</span>
            </div>
        </nav>

        <main class="container pb-5">
            @if (session('success'))
                <div class="alert alert-success border-0 shadow-sm">{{ session('success') }}</div>
            @endif

            @yield('content')
        </main>
    </div>
</body>
</html>
