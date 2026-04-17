<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>StockTrack Product User</title>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/viewer/app.jsx'])
</head>
<body>
    <div id="app"></div>
    <script>
        window.StockTrackAuth = @json(auth()->user()?->only(['name', 'email', 'role']));
    </script>
</body>
</html>
