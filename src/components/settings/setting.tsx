import type { DisplayType } from "@/components/timer-displays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ButtonGroup } from "@/components/ui/button-group";
import { Moon, Monitor, Settings, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface KillerSettingsProps {
  focusMinutes: number;
  breakMinutes: number;
  displayType: DisplayType;
  onFocusMinutesChange: (minutes: number) => void;
  onBreakMinutesChange: (minutes: number) => void;
  onDisplayTypeChange: (type: DisplayType) => void;
}

export const KillerSettings = ({
  focusMinutes,
  breakMinutes,
  displayType,
  onFocusMinutesChange,
  onBreakMinutesChange,
  onDisplayTypeChange,
}: KillerSettingsProps) => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">(() => {
    // 从 localStorage 读取主题，如果没有则默认为 system
    const stored = localStorage.getItem("theme");
    if (
      stored &&
      (stored === "light" || stored === "dark" || stored === "system")
    ) {
      return stored as "light" | "dark" | "system";
    }
    return "system";
  });

  // 检测系统主题偏好
  const getSystemTheme = () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // 应用主题
  const applyTheme = (themeValue: "light" | "dark" | "system") => {
    const actualTheme = themeValue === "system" ? getSystemTheme() : themeValue;

    if (actualTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 设置主题
  const setThemeValue = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // 初始化主题
  useEffect(() => {
    applyTheme(theme);
  }, []);

  const displayOptions: { type: DisplayType; label: string }[] = [
    { type: "counter", label: "Counter" },
    { type: "circular", label: "Circular" },
    { type: "progress", label: "Progress" },
    { type: "minimal", label: "Minimal" },
    { type: "digital", label: "Digital" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon-sm">
          <Settings />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">设置</h3>
            <p className="text-xs text-muted-foreground">
              自定义你的番茄钟工作体验
            </p>
          </div>

          <Separator />

          {/* 主题切换 */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">主题模式</label>
            </div>
            <ButtonGroup>
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setThemeValue("light")}
                className="flex items-center gap-2"
              >
                <Sun className="w-4 h-4" />
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setThemeValue("dark")}
                className="flex items-center gap-2"
              >
                <Moon className="w-4 h-4" />
              </Button>
              <Button
                variant={theme === "system" ? "default" : "outline"}
                size="sm"
                onClick={() => setThemeValue("system")}
                className="flex items-center gap-2"
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </ButtonGroup>
          </div>

          <Separator />

          {/* 专注时长设置 */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <label htmlFor="focus" className="text-sm font-medium">
                专注时长（分钟）
              </label>
            </div>
            <Input
              id="focus"
              type="number"
              min="1"
              max="120"
              value={focusMinutes}
              onChange={(e) =>
                onFocusMinutesChange(parseInt(e.target.value) || 25)
              }
              className="w-24"
            />
          </div>

          {/* 休息时长设置 */}
          <div className="flex items-center gap-2 justify-between">
            <label htmlFor="break" className="text-sm font-medium">
              休息时长（分钟）
            </label>
            <Input
              id="break"
              type="number"
              min="1"
              max="60"
              value={breakMinutes}
              onChange={(e) =>
                onBreakMinutesChange(parseInt(e.target.value) || 5)
              }
              className="w-24"
            />
          </div>

          <Separator />

          {/* 显示样式切换 */}
          <div className="flex items-center gap-2 justify-between">
            <label className="text-sm font-medium">显示样式</label>
            <Select
              value={displayType}
              onValueChange={(value) =>
                onDisplayTypeChange(value as DisplayType)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a display type" />
              </SelectTrigger>
              <SelectContent>
                {displayOptions.map((option) => (
                  <SelectItem key={option.type} value={option.type}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
