import { Button, type ButtonColor } from "@genroot/builder/ui/button/button";

export function ButtonControl({
  onClick,
  id,
  color = "Blue",
}: {
  onClick: () => void;
  id: string;
  color?: ButtonColor;
}) {
  return (
    <div className="mb-4 mr-2 inline-block">
      <Button size="Small" color={color} onClick={onClick}>
        {id}
      </Button>
    </div>
  );
}
