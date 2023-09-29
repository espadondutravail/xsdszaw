import { isHotkeyPressed } from "react-hotkeys-hook";
import { atom, onMount } from "nanostores";
import { $publisher, subscribe } from "~/shared/pubsub";

type CommandMeta<CommandName extends string> = {
  // @todo category, description
  name: CommandName;
  // default because hotkeys can be customized from ui
  defaultHotkeys?: string[];
};

type CommandHandler = (source: string) => void;

/**
 * Command can be registered by builder, canvas or plugin
 */
type Command<CommandName extends string> = CommandMeta<CommandName> & {
  /**
   * Command handler accepting source where was triggered
   * which is builder, canvas or plugin name
   */
  handler: CommandHandler;
};

/*
 * expose command metas to synchronize between builder, canvas and plugins
 */
export const $commandMetas = atom(new Map<string, CommandMeta<string>>());

export const createCommandsEmitter = <CommandName extends string>({
  source,
  commands,
}: {
  source: string;
  // type only input to describe available commands from builder or other plugins
  externalCommands?: CommandName[];
  commands: Command<CommandName>[];
}) => {
  const commandMetas = new Map($commandMetas.get());
  const commandHandlers = new Map<string, CommandHandler>();
  for (const { handler, ...meta } of commands) {
    commandMetas.set(meta.name, meta);
    commandHandlers.set(meta.name, handler);
  }

  if (commands.length > 0) {
    onMount($commandMetas, () => {
      // use the next tick after subscription started
      Promise.resolve().then(() => {
        // @todo use patches to avoid race when both builder and canvas send commands
        $commandMetas.set(commandMetas);
      });
    });
  }

  const emitCommand = (name: CommandName) => {
    const { publish } = $publisher.get();
    publish({
      type: "command",
      payload: {
        source,
        name,
      },
    });
  };

  /**
   * Execute handlers in app where defined whenever command is emitted
   */
  const subscribeCommands = () => {
    const unsubscribePubsub = subscribe("command", ({ source, name }) => {
      commandHandlers.get(name)?.(source);
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      const commandMetas = $commandMetas.get();
      let emitted = false;
      for (const commandMeta of commandMetas.values()) {
        if (
          commandMeta.defaultHotkeys?.some((hotkey) =>
            isHotkeyPressed(hotkey.split("+"))
          )
        ) {
          emitted = true;
          emitCommand(commandMeta.name as CommandName);
        }
      }
      // command can redefine browser hotkeys
      // always prevent to avoid unexpected behavior
      if (emitted) {
        event?.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      unsubscribePubsub();
      document.removeEventListener("keydown", handleKeyDown);
    };
  };

  return {
    emitCommand,
    subscribeCommands,
  };
};
