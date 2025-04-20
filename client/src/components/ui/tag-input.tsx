import { useState, KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface TagInputProps {
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
}

const TagInput = ({ placeholder = "Add tag...", tags, setTags }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
    }
    
    setInputValue("");
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
      {tags.map((tag, index) => (
        <div 
          key={index} 
          className="bg-blue-100 text-primary-dark px-3 py-1 rounded-full text-sm flex items-center"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => inputValue && addTag(inputValue)}
        placeholder={placeholder}
        className="flex-grow border-none shadow-none focus-visible:ring-0 p-1 h-8 text-sm"
      />
    </div>
  );
};

export default TagInput;
