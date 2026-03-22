import React from "react";

export function RangeControl({
  id,
  min,
  max,
  step,
  value,
  onChange,
}: {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const inputId = React.useId();

  const onRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value));
  };

  return (
    <div className="mb-4">
      <label className="font-bold mb-1 block" htmlFor={inputId}>
        {id}
      </label>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        defaultValue={value}
        step={step}
        onChange={onRangeChange}
      />
    </div>
  );
}
