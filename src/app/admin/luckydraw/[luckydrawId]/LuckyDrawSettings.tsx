import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Settings live in `@/lib/luckydraw-settings` so the public view-only page can
// use them without pulling this whole Sheet into its bundle. Re-exported here
// to keep existing imports working.
export {
  DEFAULT_SETTINGS,
  type AnimationSettings,
} from "@/lib/luckydraw-settings";

import {
  DEFAULT_SETTINGS,
  type AnimationSettings,
} from "@/lib/luckydraw-settings";

interface LuckyDrawSettingsProps {
  settings: AnimationSettings;
  onSettingsChange: (settings: AnimationSettings) => void;
  isSpinning: boolean;
  showSettings: boolean;
  onShowSettingsChange: (show: boolean) => void;
}

const LuckyDrawSettings: React.FC<LuckyDrawSettingsProps> = React.memo(
  ({
    settings,
    onSettingsChange,
    isSpinning,
    showSettings,
    onShowSettingsChange,
  }) => {
    const [showAdvancedSettings, setShowAdvancedSettings] =
      React.useState(false);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

    const updateSetting = React.useCallback(
      <K extends keyof AnimationSettings>(
        key: K,
        value: AnimationSettings[K]
      ) => {
        onSettingsChange({ ...settings, [key]: value });
      },
      [settings, onSettingsChange]
    );

    return (
      <Sheet open={showSettings} onOpenChange={onShowSettingsChange}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size={isMobile ? "sm" : "default"}
            className="backdrop-blur-md bg-white/80 border border-white/50 hover:bg-white/90 text-gray-700 shadow-lg text-xs sm:text-sm"
            style={{
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <Settings className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Lucky Draw Settings
            </SheetTitle>
            <p className="text-sm text-muted-foreground">
              Customize the animation, visual effects, and behavior
            </p>
          </SheetHeader>

          <div className="mt-6 space-y-6 pb-6">
            {/* Basic Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">
                Basic Settings
              </h3>

              {/* Duration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Spin Duration</label>
                  <span className="text-sm text-muted-foreground">
                    {(settings.duration / 1000).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  min="8000"
                  max="18000"
                  step="1000"
                  value={settings.duration}
                  onChange={(e) =>
                    updateSetting("duration", parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={isSpinning}
                />
                <div className="text-xs text-muted-foreground">
                  Controls the total spin time (8-18 seconds)
                </div>
              </div>

              {/* Deceleration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Deceleration Intensity
                  </label>
                  <span className="text-sm text-muted-foreground">
                    {settings.easeExponent}
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="1"
                  value={settings.easeExponent}
                  onChange={(e) =>
                    updateSetting("easeExponent", parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  disabled={isSpinning}
                />
                <div className="text-xs text-muted-foreground">
                  Lower = gradual slowdown, Higher = dramatic brake effect
                </div>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Sound Effects</label>
                  <div className="text-xs text-muted-foreground">
                    Spin sounds and celebration audio
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateSetting("enableSounds", !settings.enableSounds)
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.enableSounds ? "bg-blue-600" : "bg-gray-200"
                  )}
                  disabled={isSpinning}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      settings.enableSounds ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Fireworks Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">
                    Confetti Animation
                  </label>
                  <div className="text-xs text-muted-foreground">
                    Celebration fireworks when winner is announced
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateSetting("enableFireworks", !settings.enableFireworks)
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    settings.enableFireworks ? "bg-blue-600" : "bg-gray-200"
                  )}
                  disabled={isSpinning}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      settings.enableFireworks
                        ? "translate-x-6"
                        : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Advanced Toggle */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSpinning}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Advanced Settings</span>
                </div>
                <motion.div
                  animate={{ rotate: showAdvancedSettings ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.div>
              </button>
            </div>

            {/* Advanced Settings */}
            <AnimatePresence>
              {showAdvancedSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden space-y-6"
                >
                  {/* Animation Control */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-700">
                      Animation Control
                    </h4>

                    {/* Spin Range */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Min Spins
                          </label>
                          <span className="text-sm text-muted-foreground">
                            {settings.minSpins}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={settings.minSpins}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            onSettingsChange({
                              ...settings,
                              minSpins: value,
                              maxSpins: Math.max(value, settings.maxSpins),
                            });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          disabled={isSpinning}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Max Spins
                          </label>
                          <span className="text-sm text-muted-foreground">
                            {settings.maxSpins}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="8"
                          step="1"
                          value={settings.maxSpins}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            onSettingsChange({
                              ...settings,
                              maxSpins: value,
                              minSpins: Math.min(value, settings.minSpins),
                            });
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          disabled={isSpinning}
                        />
                      </div>
                    </div>

                    {/* Idle Speed */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Idle Animation Speed
                        </label>
                        <span className="text-sm text-muted-foreground">
                          {settings.idleSpeed}px/s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="10"
                        value={settings.idleSpeed}
                        onChange={(e) =>
                          updateSetting("idleSpeed", parseInt(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={isSpinning}
                      />
                      <div className="text-xs text-muted-foreground">
                        Controls the gentle movement between spins (0 =
                        disabled)
                      </div>
                    </div>
                  </div>

                  {/* Visual Effects */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-700">
                      Visual Effects
                    </h4>
                    {/* Background */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Background
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateSetting("backgroundMode", "solid")
                            }
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium border",
                              settings.backgroundMode === "solid"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200"
                            )}
                            disabled={isSpinning}
                          >
                            Solid
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateSetting("backgroundMode", "gradient")
                            }
                            className={cn(
                              "px-2 py-1 rounded text-xs font-medium border",
                              settings.backgroundMode === "gradient"
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white text-gray-600 border-gray-200"
                            )}
                            disabled={isSpinning}
                          >
                            Gradient
                          </button>
                        </div>
                      </div>

                      {settings.backgroundMode === "solid" && (
                        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={settings.backgroundSolidColor}
                              onChange={(e) =>
                                updateSetting(
                                  "backgroundSolidColor",
                                  e.target.value
                                )
                              }
                              className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                              disabled={isSpinning}
                            />
                            <span className="text-xs text-muted-foreground">
                              Color
                            </span>
                          </div>
                        </div>
                      )}

                      {settings.backgroundMode === "gradient" && (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.backgroundGradientFrom}
                                onChange={(e) =>
                                  updateSetting(
                                    "backgroundGradientFrom",
                                    e.target.value
                                  )
                                }
                                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                                disabled={isSpinning}
                              />
                              <span className="text-xs text-muted-foreground">
                                From
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={settings.backgroundGradientTo}
                                onChange={(e) =>
                                  updateSetting(
                                    "backgroundGradientTo",
                                    e.target.value
                                  )
                                }
                                className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                                disabled={isSpinning}
                              />
                              <span className="text-xs text-muted-foreground">
                                To
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium">
                                Angle
                              </label>
                              <span className="text-xs text-muted-foreground">
                                {settings.backgroundGradientAngle}°
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              step="5"
                              value={settings.backgroundGradientAngle}
                              onChange={(e) =>
                                updateSetting(
                                  "backgroundGradientAngle",
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                              disabled={isSpinning}
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Overlay Opacity
                          </label>
                          <span className="text-sm text-muted-foreground">
                            {(settings.backgroundOverlayOpacity * 100).toFixed(
                              0
                            )}
                            %
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.8"
                          step="0.05"
                          value={settings.backgroundOverlayOpacity}
                          onChange={(e) =>
                            updateSetting(
                              "backgroundOverlayOpacity",
                              parseFloat(e.target.value)
                            )
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          disabled={isSpinning}
                        />
                        <div className="text-xs text-muted-foreground">
                          White veil for contrast (0% - 80%)
                        </div>
                      </div>
                    </div>

                    {/* Visible Range */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Visible Items
                        </label>
                        <span className="text-sm text-muted-foreground">
                          {settings.visibleRange * 2 + 1} total
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        step="5"
                        value={settings.visibleRange}
                        onChange={(e) =>
                          updateSetting(
                            "visibleRange",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={isSpinning}
                      />
                    </div>

                    {/* Scale Settings */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Center Scale
                          </label>
                          <span className="text-sm text-muted-foreground">
                            {settings.centerItemScale}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="150"
                          step="2"
                          value={settings.centerItemScale * 100}
                          onChange={(e) =>
                            updateSetting(
                              "centerItemScale",
                              parseInt(e.target.value) / 100
                            )
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          disabled={isSpinning}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">
                            Near Scale
                          </label>
                          <span className="text-sm text-muted-foreground">
                            {settings.nearCenterScale}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="120"
                          step="1"
                          value={settings.nearCenterScale * 100}
                          onChange={(e) =>
                            updateSetting(
                              "nearCenterScale",
                              parseInt(e.target.value) / 100
                            )
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          disabled={isSpinning}
                        />
                      </div>
                    </div>

                    {/* Blur */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Edge Blur Intensity
                        </label>
                        <span className="text-sm text-muted-foreground">
                          {settings.maxBlur}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="3"
                        step="0.1"
                        value={settings.maxBlur}
                        onChange={(e) =>
                          updateSetting("maxBlur", parseFloat(e.target.value))
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={isSpinning}
                      />
                    </div>

                    {/* Custom Colors */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Custom Theme Colors
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            updateSetting(
                              "useCustomColors",
                              !settings.useCustomColors
                            )
                          }
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.useCustomColors
                              ? "bg-blue-600"
                              : "bg-gray-200"
                          )}
                          disabled={isSpinning}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.useCustomColors
                                ? "translate-x-6"
                                : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      {settings.useCustomColors && (
                        <div className="grid grid-cols-2 gap-2">
                          {settings.customColors.map((color, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="color"
                                value={color}
                                onChange={(e) => {
                                  const newColors = [...settings.customColors];
                                  newColors[index] = e.target.value;
                                  updateSetting("customColors", newColors);
                                }}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                                disabled={isSpinning}
                              />
                              <span className="text-xs text-muted-foreground">
                                Color {index + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audio Settings */}
                  {settings.enableSounds && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-700">
                        Audio Settings
                      </h4>
                      <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium">
                              Sound Fade Start
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {(settings.soundFadeStartPercent * 100).toFixed(
                                0
                              )}
                              %
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.5"
                            max="0.8"
                            step="0.05"
                            value={settings.soundFadeStartPercent}
                            onChange={(e) =>
                              updateSetting(
                                "soundFadeStartPercent",
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSpinning}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium">
                              Fade Duration
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {(settings.soundFadeDuration * 100).toFixed(0)}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="0.5"
                            step="0.05"
                            value={settings.soundFadeDuration}
                            onChange={(e) =>
                              updateSetting(
                                "soundFadeDuration",
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSpinning}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fireworks Settings */}
                  {settings.enableFireworks && (
                    <div className="space-y-4">
                      <h4 className="text-md font-semibold text-gray-700">
                        Celebration Effects
                      </h4>
                      <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium">
                              Duration
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {(settings.fireworksDuration / 1000).toFixed(1)}s
                            </span>
                          </div>
                          <input
                            type="range"
                            min="3000"
                            max="10000"
                            step="500"
                            value={settings.fireworksDuration}
                            onChange={(e) =>
                              updateSetting(
                                "fireworksDuration",
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSpinning}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium">
                              Intensity
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {settings.fireworksParticleCount}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="200"
                            max="1000"
                            step="50"
                            value={settings.fireworksParticleCount}
                            onChange={(e) =>
                              updateSetting(
                                "fireworksParticleCount",
                                parseInt(e.target.value)
                              )
                            }
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            disabled={isSpinning}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Winner Display */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Winner Display Time
                      </label>
                      <span className="text-sm text-muted-foreground">
                        {(settings.winnerDisplayDuration / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1000"
                      max="8000"
                      step="500"
                      value={settings.winnerDisplayDuration}
                      onChange={(e) =>
                        updateSetting(
                          "winnerDisplayDuration",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      disabled={isSpinning}
                    />
                  </div>

                  {/* Performance */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-700">
                      Performance
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">
                          Spinner Item Pool
                        </label>
                        <span className="text-sm text-muted-foreground">
                          {settings.spinnerItemCount} items
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="25"
                        value={settings.spinnerItemCount}
                        onChange={(e) =>
                          updateSetting(
                            "spinnerItemCount",
                            parseInt(e.target.value)
                          )
                        }
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        disabled={isSpinning}
                      />
                      <div className="text-xs text-muted-foreground">
                        More items = smoother long spins, but uses more memory
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reset */}
            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => onSettingsChange(DEFAULT_SETTINGS)}
                disabled={isSpinning}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All Settings
              </Button>
              <div className="text-xs text-muted-foreground mt-2 text-center">
                Restore all settings to their default values
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }
);

LuckyDrawSettings.displayName = "LuckyDrawSettings";

export default LuckyDrawSettings;
