// Type declarations for modules without type definitions
declare module 'react' {
  export * from 'react';
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