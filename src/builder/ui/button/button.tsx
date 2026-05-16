import {
  makeButtonClassNames,
  type ButtonSize,
  type ButtonColor,
} from "./buttonStyles";

export type { ButtonSize, ButtonColor } from "./buttonStyles";

type BaseButtonProps = {
  size: ButtonSize;
  color: ButtonColor;
  children: React.ReactNode;
  title: string;
  disabled: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

function BaseButton({
  size,
  color,
  children,
  title,
  disabled,
  onClick,
}: BaseButtonProps) {
  const classNameWithStyles = makeButtonClassNames({ size, color });

  return (
    <button
      className={classNameWithStyles}
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export type ButtonState = "Ready" | "Disabled";

function makeButtonProps(state: ButtonState): {
  disabled: boolean;
} {
  switch (state) {
    case "Ready":
      return {
        disabled: false,
      };
    case "Disabled":
      return {
        disabled: true,
      };
  }
}

export type ButtonProps = {
  children: React.ReactNode;
  title: string;
  state?: ButtonState;
  size?: ButtonSize;
  color?: ButtonColor;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
};

export function Button({
  children,
  title,
  state = "Ready",
  size = "Medium",
  color = "Blue",
  onClick,
}: ButtonProps) {
  const { disabled } = makeButtonProps(state);
  return (
    <BaseButton
      size={size}
      color={color}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </BaseButton>
  );
}
