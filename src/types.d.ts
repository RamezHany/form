// Type declarations for modules without type definitions
declare module 'react' {
  // Instead of re-exporting from 'react', we'll define the necessary types
  export type ReactNode = 
    | string
    | number
    | boolean
    | null
    | undefined
    | React.ReactElement
    | React.ReactFragment
    | React.ReactPortal;

  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T;
    props: P;
    key: Key | null;
  }

  export type JSXElementConstructor<P> = (props: P) => ReactElement<any, any> | null;
  export type Key = string | number;
  export type ReactFragment = Iterable<ReactNode>;
  export type ReactPortal = ReactElement;

  export interface FormEvent<T = Element> extends SyntheticEvent<T> {}
  export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
    target: EventTarget & T;
  }
  export interface SyntheticEvent<T = Element, E = Event> {
    nativeEvent: E;
    currentTarget: T;
    target: EventTarget;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    preventDefault(): void;
    stopPropagation(): void;
    timeStamp: number;
    type: string;
  }

  export interface HTMLAttributes<T> {
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export interface DetailedHTMLProps<A extends HTMLAttributes<T>, T> extends A {
    ref?: React.Ref<T>;
  }

  export interface CSSProperties {
    [key: string]: string | number | undefined;
  }

  export type Ref<T> = ((instance: T | null) => void) | React.RefObject<T> | null;
  export interface RefObject<T> {
    readonly current: T | null;
  }

  // React hooks
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  export function useRef<T>(initialValue: T): React.RefObject<T>;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<any>): T;
  export function useMemo<T>(factory: () => T, deps: ReadonlyArray<any>): T;
  export function useContext<T>(context: React.Context<T>): T;
  
  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string;
  }
  
  export interface Provider<T> {
    (props: ProviderProps<T>): ReactElement | null;
  }
  
  export interface Consumer<T> {
    (props: ConsumerProps<T>): ReactElement | null;
  }
  
  export interface ProviderProps<T> {
    value: T;
    children?: ReactNode;
  }
  
  export interface ConsumerProps<T> {
    children: (value: T) => ReactNode;
  }
  
  export function createContext<T>(defaultValue: T): Context<T>;
}

declare module 'next-auth/react' {
  export interface Session {
    user?: {
      name?: string;
      email?: string;
      image?: string;
      type?: string;
    };
  }
  
  export function useSession(): {
    data: Session | null;
    status: "loading" | "authenticated" | "unauthenticated";
  };
  
  export interface SignInOptions {
    callbackUrl?: string;
    redirect?: boolean;
    [key: string]: unknown;
  }
  
  export interface SignOutOptions {
    callbackUrl?: string;
    redirect?: boolean;
  }
  
  export function signIn(provider?: string, options?: SignInOptions): Promise<unknown>;
  export function signOut(options?: SignOutOptions): Promise<unknown>;
}

declare module 'next/navigation' {
  export function useRouter(): {
    push(url: string): void;
    replace(url: string): void;
    back(): void;
  };
  
  export function useParams(): Record<string, string | string[]>;
}

declare module 'next/link' {
  import { ComponentProps, ReactElement } from 'react';
  
  export interface LinkProps extends ComponentProps<'a'> {
    href: string;
    as?: string;
    replace?: boolean;
    scroll?: boolean;
    shallow?: boolean;
    prefetch?: boolean;
    className?: string;
  }
  
  export default function Link(props: LinkProps): ReactElement;
}

declare module 'next/image' {
  import { ComponentProps, ReactElement } from 'react';
  
  export interface ImageLoaderProps {
    src: string;
    width: number;
    quality?: number;
  }
  
  export type ImageLoader = (params: ImageLoaderProps) => string;
  
  export interface ImageProps extends Omit<ComponentProps<'img'>, 'src' | 'width' | 'height'> {
    src: string;
    width?: number;
    height?: number;
    fill?: boolean;
    loader?: ImageLoader;
    quality?: number;
    priority?: boolean;
    loading?: 'lazy' | 'eager';
    unoptimized?: boolean;
  }
  
  export default function Image(props: ImageProps): ReactElement;
}

// Add JSX namespace to fix JSX element errors
namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
  }
} 