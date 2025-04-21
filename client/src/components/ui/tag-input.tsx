import React, { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({
  placeholder = "Add tag...",
  tags,
  setTags,
  disabled = false,
}) => {
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input) {
      e.preventDefault();
      if (!tags.includes(input.trim()) && input.trim() !== "") {
        setTags([...tags, input.trim()]);
        setInput("");
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      // Remove the last tag when pressing backspace with empty input
      setTags(tags.slice(0, -1));
    }
  };

  const addTag = () => {
    if (input.trim() && !tags.includes(input.trim())) {
      setTags([...tags, input.trim()]);
      setInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 p-1.5 border rounded-md min-h-[42px] bg-background mb-2">
        {tags.map((tag, index) => (
          <div
            key={`${tag}-${index}`}
            className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md"
          >
            <span className="text-sm">{tag}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-primary/20"
              onClick={() => removeTag(tag)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        <div className="flex-1 flex items-center">
          <Input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 py-1"
            disabled={disabled}
          />
          {input.trim() && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addTag}
              className="p-1 h-6 w-6"
              disabled={disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TagInput;