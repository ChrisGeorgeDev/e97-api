import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
  // Self-contained HTML portfolio reports (see src/middlewares/uploads-frame-policy.ts
  // for the matching frame-embedding fix — both are required for these to display).
  'text/html',
];

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },
  upload: {
    config: {
      // strapi-provider-upload-azure-sa: only community Azure Blob Storage
      // provider available (Strapi ships no official one). Auth mode is
      // whichever of accountKey/sasToken is non-empty — see the package's
      // src/azure-client.ts: a truthy sasToken takes priority over
      // accountKey. Until real Azure credentials are filled in below,
      // uploads will fail — same accepted gap as the blank Resend/Clerk
      // secrets elsewhere in this repo.
      provider: 'strapi-provider-upload-azure-sa',
      providerOptions: {
        account: env('AZURE_STORAGE_ACCOUNT'),
        accountKey: env('AZURE_STORAGE_ACCOUNT_KEY'),
        sasToken: env('AZURE_STORAGE_SAS_TOKEN'),
        containerName: env('AZURE_STORAGE_CONTAINER'),
        defaultPath: 'uploads',
      },
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes: deniedExecutableTypes,
      },
    },
  },
});

export default config;
