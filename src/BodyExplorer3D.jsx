import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function BodyPart({ name, position, scale, selected, onSelect }) {
  return (
    <mesh
      position={position}
      scale={scale}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(name);
      }}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial
        color={selected === name ? "#38bdf8" : "#9bc9f5"}
        metalness={0.15}
        roughness={0.45}
      />
    </mesh>
  );
}

export default function BodyExplorer3D({
  selectedBodyPart,
  onSelectBodyPart,
}) {
  const part = (name, position, scale) => (
    <BodyPart
      name={name}
      position={position}
      scale={scale}
      selected={selectedBodyPart}
      onSelect={onSelectBodyPart}
    />
  );

  return (
    <div style={{ width: "100%", height: "430px" }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
        <ambientLight intensity={1.5} />
        <directionalLight position={[3, 4, 5]} intensity={2} />

        <group>
          {part("Head", [0, 1.55, 0], [0.34, 0.4, 0.32])}
          {part("Chest", [0, 0.7, 0], [0.65, 0.75, 0.35])}
          {part("Abdomen", [0, -0.1, 0], [0.45, 0.45, 0.3])}

          {part("Arms", [-0.82, 0.45, 0], [0.22, 0.85, 0.22])}
          {part("Arms", [0.82, 0.45, 0], [0.22, 0.85, 0.22])}

          {part("Legs", [-0.28, -1.15, 0], [0.26, 0.95, 0.26])}
          {part("Legs", [0.28, -1.15, 0], [0.26, 0.95, 0.26])}
        </group>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={9}
        />
      </Canvas>
    </div>
  );
}

