# syntax=docker/dockerfile:1.7

FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
ENV CGO_ENABLED=0 GOOS=linux
RUN go build -trimpath -ldflags="-s -w" -o /out/ttr-server ./cmd/server

FROM gcr.io/distroless/static:nonroot
WORKDIR /
COPY --from=build /out/ttr-server /ttr-server
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/ttr-server", "serve"]
