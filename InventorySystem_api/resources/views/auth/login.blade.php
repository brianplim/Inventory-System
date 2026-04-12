<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StockTrack Login</title>
    @viteReactRefresh
    @vite(['resources/css/app.css'])
</head>
<body>
    <main class="auth-shell">
        <section class="auth-card panel">
            <div class="auth-brand">
                <img src="/stocktrack-logo.svg" alt="StockTrack logo" class="auth-logo">
                <div>
                    <p class="eyebrow">Login</p>
                    <h1>StockTrack</h1>
                </div>
            </div>

            @if (session('auth_error'))
                <div class="flash-message flash-error">{{ session('auth_error') }}</div>
            @endif

            <form method="POST" action="/login" class="auth-form">
                @csrf

                <div class="auth-heading">
                    <h3>Welcome back</h3>
                </div>

                <div class="form-field form-field-wide">
                    <label for="email">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value="{{ old('email') }}"
                        placeholder="you@example.com"
                        required
                        autofocus
                    >
                    @error('email')
                        <p class="field-error">{{ $message }}</p>
                    @enderror
                </div>

                <div class="form-field form-field-wide">
                    <label for="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                    >
                    @error('password')
                        <p class="field-error">{{ $message }}</p>
                    @enderror
                </div>

                <label class="checkbox-row">
                    <input name="remember" type="checkbox" value="1">
                    Keep me signed in on this browser
                </label>

                <button class="primary-button auth-submit" type="submit">Log In</button>
            </form>

            <div class="auth-credentials">
                <span><strong>Admin:</strong> admin@stocktrack.test / password123</span>
                <span><strong>Viewer:</strong> viewer@stocktrack.test / password123</span>
            </div>
        </section>
    </main>
</body>
</html>
