import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import HandlerBuilder from 'handler-builder';
import { Server } from 'http';
import * as getPort from 'get-port';

const matchAwsJson = (request: express.Request) => {
  const type = request.header('content-type');
  return type === 'application/json' || /application\/x-amz-json-.*/.test(type);
};

export type HandlerMap<TAction extends string = string> = {
  [P in TAction]: (request: express.Request, response: express.Response) => any
};

export class AwsEndpoint<TAction extends string = string> {
  public readonly app: express.Express;
  private server: Server;

  constructor(
    private service: string,
    handlers: HandlerMap<TAction>,
    app?: express.Express
  ) {
    if (!app) {
      app = express();
    }

    app.use(cors());
    app.use(bodyParser.json({ type: matchAwsJson }));
    app.options('/', cors());

    const builder = this.getHandlerBuilder();
    const handler = builder.build(handlers);

    app.post('/', (request, response, next) => {
      const result = handler(request, response);

      if (result && result.then) {
        result.then(null, next);
      }
    });

    this.app = app;
  }

  async start(port?: number): Promise<number> {
    if (!port) {
      port = await getPort();
    }
    this.server = await this.app.listen(port);
    return port;
  }

  stop() {
    this.server.close();
  }

  private getHandlerBuilder() {
    return new HandlerBuilder(
      (request: express.Request, response: express.Response) => {
        const target = request.header('x-amz-target');

        if (!target) {
          response.status(400).json({
            __type: 'UnknownOperationException',
            message: 'missing x-amz-target header'
          });
          return null;
        }

        const [service, action] = target.split('.');

        if (service !== this.service) {
          response.status(400).json({
            __type: 'UnknownOperationException',
            message: `expected target service to be ${
              this.service
            }, not ${service}.`
          });
          return null;
        }

        return action;
      },

      (request: express.Request, response: express.Response) => {
        if (!response.headersSent) {
          response.status(400).send({
            __type: 'UnknownOperationException',
            message:
              'Cannot process requested action: ' +
              request.header('x-amz-target')
          });
        }
      }
    );
  }
}
