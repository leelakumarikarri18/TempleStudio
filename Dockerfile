FROM golang:1.25-alpine AS build
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /temple-studio ./cmd/server

FROM scratch
COPY --from=build /temple-studio /temple-studio
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["/temple-studio"]
