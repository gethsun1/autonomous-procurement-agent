import React from "react";

interface Props {
    children: React.ReactNode;
}

export default function AnimatedBorder({ children }: Props) {
    return (
        <div className="animated-border-wrapper w-full">
            <div className="animated-border-content w-full">
                {children}
            </div>
        </div>
    );
}
