'use client';

export function AnimatedWave() {
    return (
        <div className="absolute inset-x-0 bottom-0 w-full h-2/3 z-0 pointer-events-none">
            <div className="ocean pointer-events-none">
                <div className="wave"></div>
                <div className="wave"></div>
            </div>
            <style jsx>{`
                .ocean { height: 100%; width: 100%; position: absolute; bottom: 0; left: 0; pointer-events: none; }
                .wave {
                    background: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 400'%3e%3cpath fill='rgba(45,212,191,0.5)' d='M0,200 C360,250 1080,150 1440,200 L1440,400 L0,400 Z'%3e%3c/path%3e%3c/svg%3e");
                    position: absolute;
                    width: 200%;
                    height: 100%;
                    background-repeat: repeat-x;
                    background-position: bottom;
                    background-size: cover;
                    bottom: 0;
                    left: 0;
                    opacity: 0.8;
                    pointer-events: none;
                }
                .wave:nth-of-type(1) { animation: wave 14s cubic-bezier(0.36,0.45,0.63,0.53) infinite, swell 6s ease-in-out infinite; opacity:1; }
                .wave:nth-of-type(2) { animation: wave 20s linear reverse infinite, swell 8s ease-in-out infinite; opacity:0.6; animation-delay: -3s; }

                @keyframes wave { 0% { transform: translateX(0); } 50% { transform: translateX(-25%); } 100% { transform: translateX(0); } }
                @keyframes swell { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
            `}</style>
        </div>
    );
}
