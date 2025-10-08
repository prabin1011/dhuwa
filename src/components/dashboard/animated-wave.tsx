'use client';

export function AnimatedWave() {
    return (
        <div className="absolute inset-0 w-full h-full">
            <div className="ocean">
                <div className="wave"></div>
                <div className="wave"></div>
                <div className="wave"></div>
            </div>
            <style jsx>{`
                .ocean {
                    height: 100%;
                    width: 100%;
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    background: hsl(var(--primary) / 0.5); /* Semi-transparent base color */
                }

                .wave {
                    background: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iaHNsKDIyMCAyMCUgNyUpIj48cGF0aCBkPSJNMTI4MCAzMS43NUMxMTAyLjMgMzEuNzUgOTU5LjYgMTE1LjE1IDc3My4yIDExNS4xNVM0NDYgNjUgMjU5LjcgNjVDNzMuMiA2NSAtNjEgMzEuNzUgLTEyNi4yIDMxLjc1djEwOEgxMjgweiIgZmlsbC1vcGFjaXR5PSIwLjUiLz48cGF0aCBkPSJNMTI4MCAzMS43NUMxMDkwLjMgMzEuNzUgOTQ4LjggMTE1LjIgNzYzLjcgMTE1LjJTNDM2LjMgNjUgMjQ5LjMgNjVDNjIgNjUgLTg0LjIgMzEuNzUgLTE1MS4yIDMxLjc1djEwOEgxMjgweiIvPjwvZz48L3N2Zz4=);
                    position: absolute;
                    width: 200%;
                    height: 100%;
                    bottom: 0;
                    left: 0;
                    background-repeat: repeat-x;
                    background-size: 50% 100%;
                    animation: wave 10s cubic-bezier(0.36, 0.45, 0.63, 0.53) infinite;
                }

                .wave:nth-of-type(2) {
                    bottom: -1.25em;
                    animation: wave 18s cubic-bezier(0.36, 0.45, 0.63, 0.53) -0.125s infinite, swell 7s ease -1.25s infinite;
                    opacity: 1;
                }

                 .wave:nth-of-type(3) {
                    bottom: -2.5em;
                    animation: wave 20s cubic-bezier(0.36, 0.45, 0.63, 0.53) -0.125s infinite, swell 7s ease -1.25s infinite;
                    opacity: 0.8;
                }

                @keyframes wave {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }

                @keyframes swell {
                    0%, 100% {
                        transform: translateY(-10px);
                    }
                    50% {
                        transform: translateY(5px);
                    }
                }
            `}</style>
        </div>
    )
}
