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
  
  export function signIn(provider?: string, options?: any): Promise<any>;
  export function signOut(options?: any): Promise<any>;
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
  }
  
  export default function Link(props: LinkProps): ReactElement;
}

declare module 'next/image' {
  import { ComponentProps, ReactElement } from 'react';
  
  export interface ImageProps extends Omit<ComponentProps<'img'>, 'src' | 'width' | 'height'> {
    src: string;
    width?: number;
    height?: number;
    fill?: boolean;
    loader?: any;
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
    [elemName: string]: any;
  }
} 