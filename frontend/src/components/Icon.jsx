// src/components/Icon.jsx
const Icon = ({ name, size = 24, alt = "" }) => {
    return (
        <img
            src={`/icons/${name}.png`}
            alt={alt}
            width={size}
            height={size}
            style={{ objectFit: "contain" }}
        />
    );
};

export default Icon;
