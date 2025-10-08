'use client';

export function AnimatedWave() {
    return (
        <div className="absolute inset-x-0 bottom-0 w-full h-1/2">
            <div className="ocean">
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
                    background: transparent;
                }

                .wave {
                    background: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 24 150 28' preserveAspectRatio='none' shape-rendering='auto'%3e%3cdefs%3e%3cpath id='gentle-wave' d='M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z' /%3e%3c/defs%3e%3cg class='parallax'%3e%3cuse xlink:href='%23gentle-wave' x='48' y='0' fill='hsla(var(--primary), 0.2)' /%3e%3cuse xlink:href='%23gentle-wave' x='48' y='3' fill='hsla(var(--primary), 0.3)' /%3e%3cuse xlink:href='%23gentle-wave' x='48' y='5' fill='hsla(var(--primary), 0.4)' /%3e%3cuse xlink:href='%23gentle-wave' x='48' y='7' fill='hsla(var(--primary), 0.5)' /%3e%3c/g%3e%3c/svg%3e");
                    position: absolute;
                    width: 200%;
                    height: 100%;
                    background-repeat: no-repeat;
                    background-position: center bottom;
                    background-size: 100% 120px;
                    bottom: -5px;
                    left: 0;
                    opacity: 0.8;
                }

                .wave:nth-of-type(1) {
                    animation: wave 10s cubic-bezier(0.36, 0.45, 0.63, 0.53) -.125s infinite, swell 7s ease -1.25s infinite;
                    transform: translate3d(0, 0, 0);
                    opacity: 1;
                }

                .wave:nth-of-type(2) {
                   animation: wave 18s linear reverse infinite;
                   opacity: 0.7;
                   animation-delay: -2s;
                }

                @keyframes wave {
                    0% {
                        transform: translateX(0);
                    }
                    50% {
                        transform: translateX(-25%);
                    }
                    100% {
                        transform: translateX(0);
                    }
                }
                
                @keyframes swell {
                    0%, 100% {
                        transform: translate3d(0,-15px,0);
                    }
                    50% {
                        transform: translate3d(0,5px,0);
                    }
                }
            `}</style>
        </div>
    )
}
